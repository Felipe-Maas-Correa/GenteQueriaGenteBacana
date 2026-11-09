import type { Metadata } from "next"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal"
import { ArticleCard } from "@/features/news/components/article-card"
import { demoArticles } from "@/features/news/demo-articles"
import { editorias } from "@/lib/site"

export const metadata: Metadata = {
  title: "Notícias",
  description: "Todas as notícias do portal, organizadas por editoria.",
}

export default function NewsIndexPage() {
  const sections = editorias
    .map((editoria) => ({
      ...editoria,
      articles: demoArticles.filter(
        (article) => article.editoria === editoria.slug
      ),
    }))
    .filter((section) => section.articles.length > 0)

  return (
    <div className="page-container py-10 sm:py-14">
      <Reveal as="header" className="max-w-3xl">
        <p className="type-overline text-brand">Notícias</p>
        <h1 className="type-h1 mt-3">Tudo o que publicamos, por editoria</h1>
        <p className="type-lead mt-4 text-muted-foreground">
          Escolha um assunto ou percorra a página inteira.
        </p>
      </Reveal>

      <div className="mt-12 space-y-16 lg:mt-16 lg:space-y-20">
        {sections.map((section) => (
          <section
            key={section.slug}
            id={section.slug}
            aria-labelledby={`editoria-${section.slug}`}
            className="grid gap-8 border-t pt-8 lg:grid-cols-12"
          >
            <Reveal className="lg:col-span-3">
              <h2
                id={`editoria-${section.slug}`}
                className="type-h2 lg:sticky lg:top-[calc(var(--topbar-h)+2rem)]"
              >
                {section.label}
              </h2>
            </Reveal>
            <RevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-9">
              {section.articles.map((article, index) => (
                <RevealItem key={article.slug}>
                  <ArticleCard
                    article={article}
                    variant={(index % 3) as 0 | 1 | 2}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        ))}
      </div>
    </div>
  )
}
