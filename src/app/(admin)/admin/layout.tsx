import type { Metadata } from "next"

import { AdminShell } from "@/components/layout/admin-shell"

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel GQGB" },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>
}
