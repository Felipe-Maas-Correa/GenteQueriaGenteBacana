"use client"

import { useState } from "react"
import { ShieldAlertIcon } from "lucide-react"
import { toast } from "sonner"

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
import { formatDateTime } from "@/lib/utils/format"
import type { UserRole } from "@/types/database"

import { listProfiles, updateProfile } from "../queries"
import { AddMemberDialog } from "./add-member-dialog"

const roleDescriptions: Record<UserRole, string> = {
  admin: "Tudo, inclusive liberar acessos.",
  editor: "Notícias, página inicial, assinantes e áreas.",
  reader: "Só lê as notícias. Sem acesso ao painel.",
}

export function TeamView() {
  const { status, user } = useAuth()
  const configured = status !== "unconfigured"
  const isAdmin = user?.role === "admin"
  const { data, loading, error, reload } = useAsync(
    () => (configured && isAdmin ? listProfiles() : Promise.resolve(null)),
    [configured, isAdmin]
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  if (!configured) return <SetupNotice />
  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Somente administradores"
        description="Peça a um administrador para gerenciar a equipe."
      />
    )
  }
  if (loading && !data) return <TableSkeleton rows={4} />
  if (error) return <QueryError message={error} onRetry={reload} />

  const changeRole = async (id: string, role: UserRole) => {
    setSavingId(id)
    const result = await updateProfile(id, { role })
    setSavingId(null)
    if (result.ok) {
      toast.success(`Acesso alterado para ${roleLabels[role].toLowerCase()}.`)
      reload()
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-small max-w-xl text-muted-foreground">
          Cadastre novos membros pelo botão ao lado. Quem cria conta pelo site entra
          como <strong>leitor</strong>; para dar acesso ao painel, mude o papel na lista.
        </p>
        <AddMemberDialog onAdded={reload} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead className="hidden md:table-cell">Desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((profile) => {
              const self = profile.id === user?.id
              return (
                <TableRow key={profile.id}>
                  <TableCell>
                    <p className="font-medium">
                      {profile.name || profile.email.split("@")[0]}
                      {self ? (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={profile.role}
                      disabled={self || savingId === profile.id}
                      onValueChange={(role) => changeRole(profile.id, role as UserRole)}
                    >
                      <SelectTrigger
                        className="w-48"
                        aria-label={`Papel de ${profile.name || profile.email}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            <span>
                              {roleLabels[role]}
                              <span className="block text-xs text-muted-foreground">
                                {roleDescriptions[role]}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDateTime(profile.created_at)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="type-caption text-muted-foreground">
        Para evitar ficar sem acesso, você não pode alterar o seu próprio papel.
      </p>
    </div>
  )
}
