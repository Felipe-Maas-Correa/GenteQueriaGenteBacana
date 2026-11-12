import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { AdminBillingView } from "@/features/billing/components/admin-billing-view"

export const metadata: Metadata = { title: "Assinaturas" }

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Circulação"
        title="Assinaturas"
        description="Pedidos de assinatura feitos pelo site, mensalidade, preços especiais e faturas mensais."
      />
      <AdminBillingView />
    </div>
  )
}
