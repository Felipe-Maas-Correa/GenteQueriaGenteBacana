"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { DatabaseIcon, HourglassIcon } from "lucide-react"

import { AdminBreadcrumbs } from "@/components/layout/admin-breadcrumbs"
import {
  AdminMobileNav,
  AdminSidebarContent,
} from "@/components/layout/admin-sidebar"
import { UserMenu } from "@/components/layout/user-menu"
import { EmptyState } from "@/components/shared/empty-state"
import { PageSkeleton } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isStaff, useAuth } from "@/features/authentication/auth-context"

/** Identificação à direita da barra superior, conforme o estado da sessão. */
function TopbarAccount() {
  const { status } = useAuth()

  if (status === "unconfigured") {
    return (
      <Badge variant="warning" className="h-7 px-2.5">
        <DatabaseIcon aria-hidden />
        <span className="hidden sm:inline">Firebase não conectado</span>
        <span className="sm:hidden">Sem banco</span>
      </Badge>
    )
  }
  if (status === "authenticated") return <UserMenu />
  return null
}

/** Decide o que mostrar na área de conteúdo conforme a autenticação. */
function AdminGate({ children }: { children: React.ReactNode }) {
  const { status, user, signOutUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [status, pathname, router])

  if (status === "loading" || status === "anonymous") return <PageSkeleton />

  // Sem Firebase configurado: libera a visualização da interface (sem dados).
  if (status === "unconfigured") return <>{children}</>

  if (user && !isStaff(user.role)) {
    return (
      <EmptyState
        icon={HourglassIcon}
        title="Acesso pendente de liberação"
        description={
          <>
            Sua conta ({user.email}) foi criada, mas ainda não recebeu permissão
            para usar o painel. Peça a um administrador para liberar o seu
            acesso.
          </>
        }
        action={
          <Button
            variant="outline"
            onClick={async () => {
              await signOutUser()
              router.replace("/login")
            }}
          >
            Sair
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}

/** Estrutura do painel (navegação + barra superior) com a barreira de acesso. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background print:block print:min-h-0 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-w) lg:block print:hidden">
        <AdminSidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-(--sidebar-w) print:block print:pl-0">
        <header className="sticky top-0 z-20 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 print:hidden">
          <AdminMobileNav />
          <AdminBreadcrumbs />
          <div className="ml-auto flex items-center gap-2">
            <TopbarAccount />
          </div>
        </header>

        <main className="mx-auto w-full max-w-(--container-max) flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:p-0">
          <AdminGate>{children}</AdminGate>
        </main>
      </div>
    </div>
  )
}
