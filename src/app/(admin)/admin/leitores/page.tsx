import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { ReadersView } from "@/features/team/components/readers-view"

export const metadata: Metadata = { title: "Leitores" }

export default function ReadersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Sistema"
        title="Leitores"
        description="Pessoas que criaram conta no site para ler as notícias. Elas não têm acesso ao painel."
      />
      <ReadersView />
    </div>
  )
}
