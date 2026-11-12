import { Suspense } from "react"

import { ArticleReaderFromQuery } from "@/features/news/components/public-views"

/** Página da notícia: /noticia?slug=… (o conteúdo vem do Firestore no navegador). */
export default function ArticlePage() {
  return (
    <Suspense>
      <ArticleReaderFromQuery />
    </Suspense>
  )
}
