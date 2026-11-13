import type { Metadata } from "next"

import { Reveal } from "@/components/shared/reveal"
import { NewsIndex } from "@/features/news/components/public-views"

export const metadata: Metadata = {
  title: "Notícias",
  description: "Todas as notícias do portal, organizadas por editoria.",
}

export default function NewsIndexPage() {
  return (
    <div className="page-container py-10 sm:py-14">
      <Reveal as="header" className="max-w-3xl">
        <p className="type-overline text-brand">Notícias</p>
        <h1 className="type-h1 mt-3">Tudo o que publicamos</h1>
      </Reveal>
      <div className="mt-12 lg:mt-16">
        <NewsIndex />
      </div>
    </div>
  )
}
