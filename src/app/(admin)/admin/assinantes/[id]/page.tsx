import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { listAreaOptions } from "@/features/areas/queries"
import { getStaffContext } from "@/features/authentication/session"
import { SubscriberForm } from "@/features/subscribers/components/subscriber-form"
import { getSubscriber } from "@/features/subscribers/queries"

export const metadata: Metadata = { title: "Editar assinante" }

export default function EditSubscriberPage({
  params,
}: PageProps<"/admin/assinantes/[id]">) {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Assinantes"
        title="Editar assinante"
        description="Atualize os dados do cadastro. Campos marcados com * são obrigatórios."
      />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <EditSubscriberForm params={params} />
      </Suspense>
    </div>
  )
}

async function EditSubscriberForm({
  params,
}: Pick<PageProps<"/admin/assinantes/[id]">, "params">) {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const { id } = await params
  const [subscriber, areas] = await Promise.all([
    getSubscriber(context.supabase, id),
    listAreaOptions(context.supabase),
  ])
  if (!subscriber) notFound()

  return <SubscriberForm areas={areas} subscriber={subscriber} />
}
