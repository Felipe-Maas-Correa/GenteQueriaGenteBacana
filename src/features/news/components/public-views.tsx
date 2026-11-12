"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeftIcon, NewspaperIcon, SearchXIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync } from "@/hooks/use-async"
import { scrollToSection, takePendingEditoria } from "@/components/layout/editoria-link"
import { CommentsSection } from "@/features/comments/components/comments-section"
import { useEditorias } from "@/features/editorias/editorias-context"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/format"

import { articleProseClass, bodyToHtml, sanitizeBody } from "../article-body"
import { resolveImagesInHtml } from "../image-source"

import {
  getPublishedArticle,
  listHomeArticles,
  listPublishedArticles,
} from "../queries"
import { ArticleCard, ArticleImage, ArticleMeta, HomeGrid } from "./article-card"

function NoNews({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <NewspaperIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="type-h3 mt-4">Nenhuma notícia por aqui ainda</p>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-3" aria-busy aria-label="Carregando notícias">
      <Skeleton className="aspect-[16/7] md:col-span-3" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[3/2]" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ))}
    </div>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground">Não foi possível carregar as notícias.</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

/* ── Página inicial ─────────────────────────────────────────── */

export function HomeFeed() {
  const { data, loading, error, reload } = useAsync(listHomeArticles, [])

  return (
    <section className="page-container pt-8 pb-16 sm:pt-10 lg:pb-24">
      <div className="mt-6">
        {loading && !data ? (
          <GridSkeleton />
        ) : error ? (
          <LoadError onRetry={reload} />
        ) : data?.length ? (
          <HomeGrid articles={data} />
        ) : (
          <NoNews message="As notícias publicadas pela redação aparecem aqui." />
        )}
      </div>
    </section>
  )
}

/* ── Índice de notícias ─────────────────────────────────────── */

export function NewsIndex() {
  const { data, loading, error, reload } = useAsync(listPublishedArticles, [])
  const { editorias } = useEditorias()

  // Depois que as seções aparecem, rola até a editoria escolhida no menu.
  // Links antigos com "#cidade" também funcionam, e o "#" sai do endereço.
  useEffect(() => {
    if (!data || !editorias.length) return
    const fromHash = window.location.hash.slice(1)
    if (fromHash) window.history.replaceState(null, "", window.location.pathname)
    const target = takePendingEditoria() ?? (fromHash || null)
    if (target) requestAnimationFrame(() => scrollToSection(target))
  }, [data, editorias.length])

  if (loading && !data) return <GridSkeleton />
  if (error) return <LoadError onRetry={reload} />

  const sections = editorias
    .map((editoria) => ({
      ...editoria,
      articles: (data ?? []).filter((a) => a.editoria === editoria.id),
    }))
    .filter((section) => section.articles.length > 0)

  if (!sections.length) {
    return <NoNews message="Assim que a redação publicar, as notícias aparecem aqui por editoria." />
  }

  return (
    <div className="space-y-16 lg:space-y-20">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.slug}
          aria-labelledby={`editoria-${section.slug}`}
          className="grid scroll-mt-24 gap-8 border-t-2 border-foreground pt-6 lg:grid-cols-12"
        >
          <h2
            id={`editoria-${section.slug}`}
            className="type-h2 lg:sticky lg:top-[calc(var(--topbar-h)+2rem)] lg:col-span-3 lg:self-start"
          >
            {section.name}
          </h2>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-9">
            {section.articles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                size="small"
                showImage
                showExcerpt
                variant={(index % 3) as 0 | 1 | 2}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ── Página da notícia ──────────────────────────────────────── */

/**
 * Corpo da notícia: o HTML do editor passa pelo DOMPurify antes de ir para a
 * tela, então nenhum script ou atributo perigoso é executado.
 */
function ArticleBody({ body }: { body: string }) {
  const { data: html } = useAsync(
    async () => resolveImagesInHtml(await sanitizeBody(bodyToHtml(body))),
    [body]
  )

  if (html === null) {
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-busy>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        articleProseClass,
        "mx-auto max-w-5xl text-foreground/90 sm:text-[1.1875rem] sm:leading-[1.75] [&>p:first-of-type]:text-[1.1875rem] sm:[&>p:first-of-type]:text-[1.3125rem] [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:font-display [&>p:first-of-type]:first-letter:text-[4.25rem] sm:[&>p:first-of-type]:first-letter:text-[5rem] [&>p:first-of-type]:first-letter:leading-[0.82] [&>p:first-of-type]:first-letter:font-medium"
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export function ArticleReader({ slug }: { slug: string }) {
  const { label } = useEditorias()
  const { data, loading, error, reload } = useAsync(
    () => getPublishedArticle(slug),
    [slug]
  )

  if (loading && !data) {
    return (
      <div className="page-container space-y-6 py-12" aria-busy aria-label="Carregando notícia">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-14 w-full max-w-3xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="aspect-[21/9] w-full" />
      </div>
    )
  }
  if (error) return <LoadError onRetry={reload} />

  const article = data?.article
  if (!article) {
    return (
      <div className="page-container py-16">
        <EmptyState
          icon={SearchXIcon}
          title="Notícia não encontrada"
          description="Ela pode ter sido removida ou o endereço está incorreto."
          action={
            <Button asChild variant="outline">
              <Link href="/noticias">Ver todas as notícias</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <article>
      <header className="page-container pt-8 sm:pt-12">
        <Link
          href="/"
          className="type-small inline-flex items-center gap-1.5 rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Voltar para a capa
        </Link>
        <Reveal className="mx-auto mt-8 max-w-5xl">
          <ArticleMeta article={article} />
          <h1 className="type-h1 mt-4 text-balance">{article.title}</h1>
          {article.excerpt ? (
            <p className="type-lead mt-5 max-w-3xl text-muted-foreground">
              {article.excerpt}
            </p>
          ) : null}
          <p className="type-small mt-6 border-t pt-4 text-muted-foreground">
            {article.author ? (
              <span className="font-medium text-foreground">Por {article.author}</span>
            ) : null}
            {article.author && article.published_at ? " · " : null}
            {article.published_at ? formatDateTime(article.published_at) : null}
            {!article.author && !article.published_at
              ? label(article.editoria)
              : null}
          </p>
        </Reveal>
      </header>

      {article.show_image || article.image_url ? (
        <figure className="page-container mt-8">
          <ArticleImage
            article={article}
            className="mx-auto aspect-[16/9] max-w-5xl rounded-sm"
          />
          {article.image_caption ? (
            <figcaption className="type-caption mx-auto mt-2 max-w-5xl text-muted-foreground">
              {article.image_caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="page-container py-12 sm:py-16">
        <ArticleBody body={article.body} />
      </div>

      <CommentsSection articleId={article.id} articleSlug={article.slug} />

      {data.related.length ? (
        <aside aria-labelledby="relacionadas" className="border-t bg-muted/50 py-14 sm:py-20">
          <div className="page-container">
            <h2 id="relacionadas" className="type-h2">
              Continue lendo
            </h2>
            <RevealGroup className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((item, index) => (
                <RevealItem key={item.id}>
                  <ArticleCard
                    article={item}
                    size="small"
                    showImage
                    variant={(index % 3) as 0 | 1 | 2}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </aside>
      ) : null}
    </article>
  )
}

/** Lê ?slug= da URL (página /noticia). */
export function ArticleReaderFromQuery() {
  const slug = useSearchParams().get("slug") ?? ""
  return <ArticleReader slug={slug} />
}
