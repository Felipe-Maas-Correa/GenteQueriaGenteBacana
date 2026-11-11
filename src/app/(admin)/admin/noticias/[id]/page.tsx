import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { EditArticleView } from "@/features/news/components/edit-article-view"

export const metadata: Metadata = { title: "Editar notícia" }

export default async function EditArticlePage({
  params,
}: PageProps<"/admin/noticias/[id]">) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <PageHeader overline="Notícias" title="Editar notícia" />
      <EditArticleView id={id} />
    </div>
  )
}
