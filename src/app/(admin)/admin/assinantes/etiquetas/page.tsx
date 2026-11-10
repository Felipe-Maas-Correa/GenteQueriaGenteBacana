import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { LabelsView } from "@/features/subscribers/components/labels-view"

export const metadata: Metadata = { title: "Etiquetas" }

export default function LabelsPage() {
  return (
    <div className="space-y-6 print:space-y-0">
      <PageHeader
        overline="Assinantes"
        title="Etiquetas"
        description="Escolha as informações e o modelo da folha, confira a prévia e imprima."
      />
      <LabelsView />
    </div>
  )
}
