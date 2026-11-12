"use client"

import { useMemo, useState } from "react"
import { ShieldAlertIcon, UsersIcon } from "lucide-react"

import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { SubscriberBadge } from "@/components/shared/subscriber-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/authentication/auth-context"
import { listSubscriptions } from "@/features/billing/data"
import { useAsync } from "@/hooks/use-async"
import { formatDateTime, formatNumber, normalizeSearch } from "@/lib/utils/format"

import { listProfiles } from "../queries"

type Filter = "todos" | "assinantes" | "nao-assinantes"

/**
 * Contas criadas pelo site (leitores). Tela só de consulta: mostra quantos
 * são e quem é assinante (selo do jornal). Só administradores veem.
 */
export function ReadersView() {
  const { status, user } = useAuth()
  const configured = status !== "unconfigured"
  const isAdmin = user?.role === "admin"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured && isAdmin
        ? Promise.all([listProfiles(), listSubscriptions()]).then(([profiles, subscriptions]) => {
            const active = new Set(subscriptions.filter((s) => s.status === "ativa").map((s) => s.uid))
            return profiles
              .filter((p) => p.role === "reader")
              .map((p) => ({ ...p, subscriber: active.has(p.id) }))
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
          })
        : Promise.resolve(null),
    [configured, isAdmin]
  )
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("todos")

  const rows = useMemo(() => {
    const term = normalizeSearch(search)
    return (data ?? []).filter(
      (p) =>
        (filter === "todos" || (filter === "assinantes") === p.subscriber) &&
        (!term || normalizeSearch(`${p.name} ${p.email}`).includes(term))
    )
  }, [data, search, filter])

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

  const subscribers = data.filter((p) => p.subscriber).length
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "todos", label: "Todos", count: data.length },
    { value: "assinantes", label: "Assinantes", count: subscribers },
    { value: "nao-assinantes", label: "Não assinantes", count: data.length - subscribers },
  ]

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="type-overline text-muted-foreground">Leitores</p>
          <p className="mt-1 font-display text-3xl font-medium">{formatNumber(data.length)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="type-overline flex items-center gap-1.5 text-muted-foreground">
            <SubscriberBadge /> Assinantes
          </p>
          <p className="mt-1 font-display text-3xl font-medium">{formatNumber(subscribers)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="type-overline text-muted-foreground">Taxa de assinatura</p>
          <p className="mt-1 font-display text-3xl font-medium">
            {Math.round((subscribers / data.length) * 100)}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome ou e-mail…"
          aria-label="Buscar leitores"
          className="w-full sm:w-80"
        />
        <div className="flex gap-1 rounded-lg border p-1" role="group" aria-label="Filtrar leitores">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={
                filter === item.value
                  ? "rounded-md bg-secondary px-3 py-1 text-sm font-medium"
                  : "rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {item.label} <span className="tabular-nums">({item.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leitor</TableHead>
              <TableHead>Assinatura</TableHead>
              <TableHead className="hidden md:table-cell">Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={profile.name || profile.email} photoUrl={profile.photo_url} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        {profile.name || profile.email.split("@")[0]}
                        {profile.subscriber ? <SubscriberBadge /> : null}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {profile.subscriber ? (
                    <Badge variant="brand">Assinante</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {formatDateTime(profile.created_at) || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhum leitor encontrado.</p>
        ) : null}
      </div>
      <p className="type-caption text-muted-foreground">
        Para dar acesso ao painel a alguém, use Sistema › Equipe › Adicionar membro.
      </p>
    </div>
  )
}
