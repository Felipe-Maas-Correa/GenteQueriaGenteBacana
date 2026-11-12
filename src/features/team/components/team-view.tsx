"use client"

import { useState } from "react"
import {
  BanIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  UserMinusIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { Profile } from "@/types/database"

import { listProfiles, updateProfile } from "../queries"
import { AddMemberDialog } from "./add-member-dialog"

type Action = "disable" | "enable" | "remove"
type Pending = { profile: Profile; action: Action }

const confirmations: Record<
  Action,
  { title: string; text: string; label: string; tone: "default" | "destructive" }
> = {
  disable: {
    title: "Desativar acesso?",
    text: "não vai mais conseguir entrar no site nem no painel até você reativar. Os dados e o papel são mantidos.",
    label: "Desativar",
    tone: "destructive",
  },
  enable: {
    title: "Reativar acesso?",
    text: "volta a conseguir entrar normalmente.",
    label: "Reativar",
    tone: "default",
  },
  remove: {
    title: "Remover da equipe?",
    text: "perde o acesso ao painel e passa a ser um leitor comum (a conta continua existindo).",
    label: "Remover",
    tone: "destructive",
  },
}

export function TeamView() {
  const { status, user } = useAuth()
  const configured = status !== "unconfigured"
  const isAdmin = user?.role === "admin"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured && isAdmin
        ? // Leitores ficam na aba Leitores; aqui só quem usa o painel.
          listProfiles().then((all) => all.filter((p) => p.role !== "reader"))
        : Promise.resolve(null),
    [configured, isAdmin]
  )
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)

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

  const confirm = async () => {
    if (!pending) return
    setSaving(true)
    const { profile, action } = pending
    const result = await updateProfile(
      profile.id,
      action === "remove" ? { role: "reader" } : { disabled: action === "disable" }
    )
    setSaving(false)
    setPending(null)
    if (!result.ok) return toast.error(result.message)
    const name = profile.name || profile.email
    toast.success(
      action === "remove"
        ? `${name} saiu da equipe.`
        : action === "disable"
          ? `Acesso de ${name} desativado.`
          : `Acesso de ${name} reativado.`
    )
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-small max-w-xl text-muted-foreground">
          Quem usa o painel do jornal. Cadastre alguém pelo botão ao lado já com a senha
          inicial; no <strong>⋯</strong> de cada pessoa você desativa o acesso ou remove da
          equipe.
        </p>
        <AddMemberDialog onAdded={reload} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="hidden md:table-cell">Desde</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((profile) => {
              const self = profile.id === user?.id
              const name = profile.name || profile.email.split("@")[0]
              return (
                <TableRow key={profile.id} className={profile.disabled ? "opacity-60" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={name} photoUrl={profile.photo_url} />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {name}
                          {self ? <span className="ml-2 text-xs text-muted-foreground">(você)</span> : null}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.role === "admin" ? "brand" : "secondary"}>
                      {roleLabels[profile.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.disabled ? (
                      <Badge variant="destructive">Desativado</Badge>
                    ) : (
                      <Badge variant="success">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDateTime(profile.created_at)}
                  </TableCell>
                  <TableCell>
                    {self ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label={`Ações para ${name}`}>
                            <MoreHorizontalIcon aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {profile.disabled ? (
                            <DropdownMenuItem onSelect={() => setPending({ profile, action: "enable" })}>
                              <RotateCcwIcon aria-hidden />
                              Reativar acesso
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setPending({ profile, action: "disable" })}>
                              <BanIcon aria-hidden />
                              Desativar acesso
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setPending({ profile, action: "remove" })}
                          >
                            <UserMinusIcon aria-hidden />
                            Remover da equipe
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="type-caption text-muted-foreground">
        Para evitar ficar sem acesso, você não pode desativar nem remover a sua própria conta.
      </p>

      {pending ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (!open ? setPending(null) : null)}
          title={confirmations[pending.action].title}
          description={
            <>
              <strong className="font-semibold text-foreground">
                {pending.profile.name || pending.profile.email}
              </strong>{" "}
              {confirmations[pending.action].text}
            </>
          }
          confirmLabel={confirmations[pending.action].label}
          tone={confirmations[pending.action].tone}
          loading={saving}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  )
}
