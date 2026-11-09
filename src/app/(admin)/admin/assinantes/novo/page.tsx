import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { listAreaOptions } from "@/features/areas/queries"
import { getStaffContext } from "@/features/authentication/session"
import { SubscriberForm } from "@/features/subscribers/components/subscriber-form"

export const metadata: Metadata = { title: "Novo assinante" }

export default function NewSubscriberPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Assinantes"
        title="Novo assinante"
        description="Preencha os dados do assinante. Campos marcados com * são obrigatórios."
      />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <NewSubscriberForm />
      </Suspense>
    </div>
  )
}

async function NewSubscriberForm() {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const areas = await listAreaOptions(context.supabase)
  return <SubscriberForm areas={areas} />
}
