"use client"

import { useMemo, useState } from "react"
import { ShieldAlertIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/authentication/auth-context"
import { roleLabels } from "@/features/authentication/roles"
import { useAsync } from "@/hooks/use-async"
import { formatDateTime, formatNumber, normalizeSearch } from "@/lib/utils/format"

import { listProfiles, updateProfile } from "../queries"

/** Contas criadas pelo site (papel "leitor"). Só administradores veem. */
export function ReadersView() {
  const { status, user } = useAuth()
  const configured = status !== "unconfigured"
  const isAdmin = user?.role === "admin"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured && isAdmin
        ? listProfiles().then((all) =>
            all
              .filter((p) => p.role === "reader")
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
          )
        : Promise.resolve(null),
    [configured, isAdmin]
  )
  const [search, setSearch] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const term = normalizeSearch(search)
    return (data ?? []).filter(
      (p) =>
        !term ||
        normalizeSearch(p.name).includes(term) ||
        normalizeSearch(p.email).includes(term)
    )
  }, [data, search])

  if (!configured) return <SetupNotice />
  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Somente administradores"
        description="Peça a um administrador para ver a lista de leitores."
      />
    )
  }
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  if (!data?.length) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nenhum leitor cadastrado"
        description="Quando alguém criar conta pelo botão Criar conta do site, aparece aqui."
      />
    )
  }

  const promote = async (id: string, role: "admin" | "editor") => {
    setSavingId(id)
    const result = await updateProfile(id, { role })
    setSavingId(null)
    if (result.ok) {
      toast.success(`Agora é ${roleLabels[role].toLowerCase()}; aparece em Equipe.`)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou e-mail…"
          aria-label="Buscar leitores"
          className="w-full sm:w-80"
        />
        <p className="type-small text-muted-foreground">
          {formatNumber(data.length)} {data.length === 1 ? "leitor" : "leitores"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leitor</TableHead>
              <TableHead className="hidden md:table-cell">Cadastro</TableHead>
              <TableHead className="text-right">Acesso ao painel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <p className="font-medium">{profile.name || profile.email.split("@")[0]}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDateTime(profile.created_at) || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Select
                    value=""
                    disabled={savingId === profile.id}
                    onValueChange={(role) => promote(profile.id, role as "admin" | "editor")}
                  >
                    <SelectTrigger
                      className="ml-auto w-44"
                      aria-label={`Dar acesso ao painel para ${profile.name || profile.email}`}
                    >
                      <SelectValue placeholder="Dar acesso…" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="editor">Tornar editor</SelectItem>
                      <SelectItem value="admin">Tornar administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhum leitor encontrado com essa busca.
          </p>
        ) : null}
      </div>
    </div>
  )
}
