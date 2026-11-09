import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal"
import { Parallax } from "@/components/shared/scroll-effects"
import {
  ArticleCard,
  ArticleMeta,
} from "@/features/news/components/article-card"
import { ArticleVisual } from "@/features/news/components/article-visual"
import {
  demoArticleBody,
  demoArticles,
  getDemoArticle,
} from "@/features/news/demo-articles"

export function generateStaticParams() {
  return demoArticles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/noticias/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const article = getDemoArticle(slug)
  if (!article) return {}
  return {
    title: article.title,
    description: article.excerpt,
    // Conteúdo ilustrativo não deve ser indexado.
    robots: { index: false },
  }
}

export default async function ArticlePage({
  params,
}: PageProps<"/noticias/[slug]">) {
  const { slug } = await params
  const article = getDemoArticle(slug)
  if (!article) notFound()

  const related = demoArticles
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)

  return (
    <article>
      <header className="page-container pt-8 sm:pt-12">
        <Link
          href="/noticias"
          className="type-small inline-flex items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Todas as notícias
        </Link>
        <Reveal className="mt-8 max-w-4xl">
          <ArticleMeta article={article} />
          <h1 className="type-h1 mt-5">{article.title}</h1>
          <p className="type-lead mt-5 max-w-2xl text-muted-foreground">
            {article.excerpt}
          </p>
        </Reveal>
      </header>

      <Reveal delay={0.1} className="page-container mt-10">
        <Parallax className="aspect-[4/3] rounded-2xl sm:aspect-[21/9]" amount={10}>
          <ArticleVisual editoria={article.editoria} className="size-full" />
        </Parallax>
      </Reveal>

      <div className="page-container py-12 sm:py-16">
        <div className="mx-auto max-w-[42rem] space-y-6">
          {demoArticleBody.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? "type-lead first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-[4.25rem] first-letter:leading-[0.82] first-letter:font-medium first-letter:text-brand"
                  : "type-body text-[1.0625rem] text-foreground/90"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <aside
        aria-labelledby="relacionadas"
        className="border-t bg-muted/50 py-14 sm:py-20"
      >
        <div className="page-container">
          <h2 id="relacionadas" className="type-h2">
            Continue lendo
          </h2>
          <RevealGroup className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <RevealItem key={item.slug}>
                <ArticleCard article={item} variant={(index % 3) as 0 | 1 | 2} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </aside>
    </article>
  )
}
