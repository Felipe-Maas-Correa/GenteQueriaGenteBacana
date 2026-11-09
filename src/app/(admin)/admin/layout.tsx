import type { Metadata } from "next"
import { Suspense } from "react"

import { AdminBreadcrumbs } from "@/components/layout/admin-breadcrumbs"
import {
  AdminMobileNav,
  AdminSidebarContent,
} from "@/components/layout/admin-sidebar"
import { PageSkeleton } from "@/components/shared/skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AdminGate,
  AdminUserMenu,
} from "@/features/authentication/components/admin-gate"

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel GQGB" },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh w-full bg-background print:block print:min-h-0 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-w) lg:block print:hidden">
        <Suspense fallback={<div className="h-full bg-sidebar" />}>
          <AdminSidebarContent />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-(--sidebar-w) print:block print:pl-0">
        <header className="sticky top-0 z-20 flex h-(--topbar-h) shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 print:hidden">
          <AdminMobileNav />
          <Suspense fallback={<Skeleton className="h-4 w-32" />}>
            <AdminBreadcrumbs />
          </Suspense>
          <div className="ml-auto flex items-center gap-2">
            <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
              <AdminUserMenu />
            </Suspense>
          </div>
        </header>

        <main className="mx-auto w-full max-w-(--container-max) flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 print:max-w-none print:p-0">
          <Suspense fallback={<PageSkeleton />}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
