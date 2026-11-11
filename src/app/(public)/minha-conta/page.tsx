import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { AccountSettings } from "@/features/authentication/components/account-settings"

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
}

/** Disponível para qualquer conta (leitor, editor ou administrador). */
export default function AccountPage() {
  return (
    <div className="page-container space-y-6 py-10 sm:py-14">
      <PageHeader
        overline="Usuário"
        title="Minha conta"
        description="Seus dados e suas preferências pessoais."
      />
      <AccountSettings />
    </div>
  )
}
