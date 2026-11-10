import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { NewSubscriberView } from "@/features/subscribers/components/new-subscriber-view"

export const metadata: Metadata = { title: "Novo assinante" }

export default function NewSubscriberPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Assinantes"
        title="Novo assinante"
        description="Preencha os dados do assinante. Campos marcados com * são obrigatórios."
      />
      <NewSubscriberView />
    </div>
  )
}
