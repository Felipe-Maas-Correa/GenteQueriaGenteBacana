"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/authentication/auth-context"
import { roleLabels } from "@/features/authentication/roles"

function InfoRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="type-small text-muted-foreground">{term}</dt>
      <dd className="type-small font-medium">{children}</dd>
    </div>
  )
}

/** Dados do usuário conectado (via contexto de autenticação do Firebase). */
export function AccountInfo() {
  const { status, user } = useAuth()

  if (status === "loading") return <Skeleton className="h-28 w-full" />

  if (status !== "authenticated" || !user) {
    return (
      <p className="type-small text-muted-foreground">
        Nenhum usuário conectado: a autenticação fica disponível depois que o
        Firebase for configurado.
      </p>
    )
  }

  return (
    <dl className="divide-y">
      <InfoRow term="Nome">{user.name}</InfoRow>
      <InfoRow term="E-mail">{user.email}</InfoRow>
      <InfoRow term="Nível de acesso">{roleLabels[user.role]}</InfoRow>
    </dl>
  )
}
