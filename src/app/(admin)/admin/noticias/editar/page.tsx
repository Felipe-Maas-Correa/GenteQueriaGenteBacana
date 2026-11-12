import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { EditArticleFromQuery } from "@/features/news/components/edit-article-view"

export const metadata: Metadata = { title: "Editar notícia" }

export default function EditArticlePage() {
  return (
    <div className="space-y-6">
      <PageHeader overline="Notícias" title="Editar notícia" />
      <Suspense>
        <EditArticleFromQuery />
      </Suspense>
    </div>
  )
}
