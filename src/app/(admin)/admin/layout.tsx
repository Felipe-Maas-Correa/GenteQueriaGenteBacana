import type { Metadata } from "next"

import { AdminShell } from "@/components/layout/admin-shell"

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel GQGB" },
  robots: { index: false, follow: false },
}

// O painel é uma área autenticada renderizada no cliente (Firebase Auth +
// Firestore no navegador), então não é pré-renderizado estaticamente.
export const instant = false

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>
}
