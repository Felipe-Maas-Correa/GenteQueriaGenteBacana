import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { AccountSettings } from "@/features/authentication/components/account-settings"

export const metadata: Metadata = { title: "Minha conta" }

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Usuário"
        title="Minha conta"
        description="Seus dados e suas preferências pessoais."
      />
      <AccountSettings />
    </div>
  )
}
