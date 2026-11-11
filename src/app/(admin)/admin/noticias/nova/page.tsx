import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { ArticleForm } from "@/features/news/components/article-form"

export const metadata: Metadata = { title: "Nova notícia" }

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Notícias"
        title="Nova notícia"
        description="Salve como rascunho para continuar depois, ou publique para que ela apareça no site."
      />
      <ArticleForm />
    </div>
  )
}
