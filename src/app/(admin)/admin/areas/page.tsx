import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { AreasView } from "@/features/areas/components/areas-view"

export const metadata: Metadata = { title: "Áreas" }

export default function AreasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Circulação"
        title="Áreas"
        description="Áreas de atendimento usadas para organizar a entrega e filtrar os assinantes."
      />
      <AreasView />
    </div>
  )
}
