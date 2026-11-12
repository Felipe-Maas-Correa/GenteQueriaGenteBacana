import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { EditSubscriberFromQuery } from "@/features/subscribers/components/edit-subscriber-view"

export const metadata: Metadata = { title: "Editar assinante" }

export default function EditSubscriberPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Assinantes"
        title="Editar assinante"
        description="Atualize os dados do cadastro. Campos marcados com * são obrigatórios."
      />
      <Suspense>
        <EditSubscriberFromQuery />
      </Suspense>
    </div>
  )
}
