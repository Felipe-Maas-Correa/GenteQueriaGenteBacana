import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { EditoriasManager } from "@/features/editorias/components/editorias-manager"

export const metadata: Metadata = { title: "Editorias" }

export default function EditoriasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Redação"
        title="Editorias"
        description="As seções do jornal: aparecem no menu do topo, no rodapé, na página de notícias e no cadastro de cada notícia."
      />
      <EditoriasManager />
    </div>
  )
}
