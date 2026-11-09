import { redirect } from "next/navigation"
import { DatabaseIcon, HourglassIcon } from "lucide-react"

import { UserMenu } from "@/components/layout/user-menu"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { signOut } from "../actions"
import { getSession, isStaff } from "../session"

/**
 * Barreira de acesso do painel: só renderiza o conteúdo para a equipe
 * autenticada. Sem Supabase configurado, libera apenas a visualização da
 * interface (não há dados nem gravação nesse modo).
 */
export async function AdminGate({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (session.status === "anonymous") redirect("/login")

  if (session.status === "authenticated" && !isStaff(session.user.role)) {
    return (
      <EmptyState
        icon={HourglassIcon}
        title="Acesso pendente de liberação"
        description={
          <>
            Sua conta ({session.user.email}) foi criada, mas ainda não recebeu
            permissão para usar o painel. Peça a um administrador para liberar o
            seu acesso.
          </>
        }
        action={
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sair
            </Button>
          </form>
        }
      />
    )
  }

  return children
}

/** Identificação do usuário na barra superior. */
export async function AdminUserMenu() {
  const session = await getSession()

  if (session.status === "unconfigured") {
    return (
      <Badge variant="warning" className="h-7 px-2.5">
        <DatabaseIcon aria-hidden />
        <span className="hidden sm:inline">Supabase não conectado</span>
        <span className="sm:hidden">Sem banco</span>
      </Badge>
    )
  }

  if (session.status === "anonymous") return null

  return (
    <UserMenu
      name={session.user.name}
      email={session.user.email}
      role={session.user.role}
    />
  )
}
