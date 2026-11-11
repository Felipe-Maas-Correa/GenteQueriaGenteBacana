import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { HomeLayoutView } from "@/features/news/components/home-layout-editor"

export const metadata: Metadata = { title: "Página inicial" }

export default function HomeLayoutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Redação"
        title="Página inicial"
        description="Escolha quais notícias aparecem na capa do site, em que ordem, em que tamanho e se mostram foto. A prévia mostra o resultado antes de salvar."
      />
      <HomeLayoutView />
    </div>
  )
}
