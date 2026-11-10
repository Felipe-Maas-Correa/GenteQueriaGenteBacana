import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { EditSubscriberView } from "@/features/subscribers/components/edit-subscriber-view"

export const metadata: Metadata = { title: "Editar assinante" }

export default async function EditSubscriberPage({
  params,
}: PageProps<"/admin/assinantes/[id]">) {
  const { id } = await params

  return (
    <div className="space-y-8">
      <PageHeader
        overline="Assinantes"
        title="Editar assinante"
        description="Atualize os dados do cadastro. Campos marcados com * são obrigatórios."
      />
      <EditSubscriberView id={id} />
    </div>
  )
}
