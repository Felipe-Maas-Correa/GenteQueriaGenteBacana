"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { useEditorias } from "@/features/editorias/editorias-context"
import { cn } from "@/lib/utils"
import type { Article, CardSize } from "@/types/database"

import { ArticleVisual } from "./article-visual"
import { routes } from "@/lib/routes"

import { StoredImage } from "../image-source"

export function articleHref(article: Pick<Article, "slug">) {
  return routes.article(article.slug)
}

/** Chapéu (rótulo editorial) + editoria. */
export function ArticleMeta({
  article,
  className,
}: {
  article: Article
  className?: string
}) {
  const { label } = useEditorias()
  return (
    <p className={cn("flex flex-wrap items-center gap-2", className)}>
      {article.kicker ? (
        <Badge
          variant={article.kicker_tone === "urgent" ? "support" : "brand"}
          shape="tag"
          className={
            article.kicker_tone === "urgent"
              ? "bg-support text-support-foreground"
              : undefined
          }
        >
          {article.kicker}
        </Badge>
      ) : null}
      <span className="type-overline text-brand">
        {label(article.editoria)}
      </span>
    </p>
  )
}

/** Foto da notícia; sem foto cadastrada, usa a arte gerada da editoria. */
export function ArticleImage({
  article,
  variant = 0,
  className,
  imgClassName,
}: {
  article: Article
  variant?: 0 | 1 | 2
  className?: string
  imgClassName?: string
}) {
  const { tone } = useEditorias()
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {article.image_url ? (
        // Fotos do Firestore (enviadas pelo painel) ou endereços externos.
        <StoredImage
          src={article.image_url}
          alt={article.image_caption || ""}
          className={cn("size-full object-cover", imgClassName)}
        />
      ) : (
        <ArticleVisual
          tone={tone(article.editoria)}
          variant={variant}
          className={cn("size-full", imgClassName)}
        />
      )}
    </div>
  )
}

const titleClass: Record<CardSize, string> = {
  hero: "type-hero",
  large: "type-h1",
  small: "type-h3",
}

type ArticleCardProps = {
  article: Article
  /** Por padrão, usa a configuração salva na própria notícia. */
  size?: CardSize
  showImage?: boolean
  showExcerpt?: boolean
  variant?: 0 | 1 | 2
  className?: string
}

/**
 * Cartão de notícia. Tamanho, foto e linha fina são definidos pelo editor no
 * painel. O link cobre o cartão inteiro e leva à página da notícia.
 */
export function ArticleCard({
  article,
  size = article.card_size,
  showImage = article.show_image,
  showExcerpt = article.show_excerpt,
  variant = 0,
  className,
}: ArticleCardProps) {
  const hero = size === "hero"
  const withImage = showImage

  return (
    <article
      className={cn(
        "group/card relative grid content-start gap-4",
        hero && withImage && "lg:grid-cols-12 lg:items-center lg:gap-10",
        className
      )}
    >
      {withImage ? (
        <ArticleImage
          article={article}
          variant={variant}
          className={cn(
            "rounded-sm",
            hero
              ? "aspect-[16/10] lg:order-2 lg:col-span-7"
              : size === "large"
                ? "aspect-[16/9]"
                : "aspect-[3/2]"
          )}
          imgClassName="transition-transform duration-[900ms] ease-emphasized group-hover/card:scale-[1.03]"
        />
      ) : null}

      <div className={cn("min-w-0", hero && withImage && "lg:col-span-5")}>
        <ArticleMeta article={article} />
        <h3
          className={cn(
            "mt-2.5 text-balance",
            hero && withImage ? "type-h1 lg:text-[3.25rem]" : titleClass[size]
          )}
        >
          <Link
            href={articleHref(article)}
            className="rounded-sm outline-none transition-colors duration-(--duration-base) after:absolute after:inset-0 group-hover/card:text-brand focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {article.title}
          </Link>
        </h3>
        {showExcerpt && article.excerpt ? (
          <p
            className={cn(
              "mt-3 text-muted-foreground",
              hero ? "type-lead max-w-2xl" : size === "large" ? "type-body" : "type-small"
            )}
          >
            {article.excerpt}
          </p>
        ) : null}
      </div>
    </article>
  )
}

const spanClass: Record<CardSize, string> = {
  hero: "md:col-span-6 lg:col-span-12",
  large: "md:col-span-6 lg:col-span-8",
  small: "md:col-span-3 lg:col-span-4",
}

/**
 * Grade da página inicial: cada cartão ocupa a largura do seu tamanho e a
 * grade preenche os espaços livres (`dense`). Usada no site e na prévia do
 * editor de página inicial.
 */
export function HomeGrid({
  articles,
  className,
}: {
  articles: Article[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-flow-row-dense gap-x-8 gap-y-10 md:grid-cols-6 lg:grid-cols-12",
        className
      )}
    >
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={cn(
            spanClass[article.card_size],
            "border-t pt-5",
            article.card_size === "hero" && "border-t-0 pt-0 pb-4"
          )}
        >
          <ArticleCard article={article} variant={(index % 3) as 0 | 1 | 2} />
        </div>
      ))}
    </div>
  )
}
