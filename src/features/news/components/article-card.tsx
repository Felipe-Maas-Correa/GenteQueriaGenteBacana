import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { editoriaLabel } from "@/lib/site"
import { cn } from "@/lib/utils"

import type { DemoArticle } from "../demo-articles"
import { ArticleVisual } from "./article-visual"

export function ArticleMeta({
  article,
  className,
}: {
  article: DemoArticle
  className?: string
}) {
  return (
    <p className={cn("flex flex-wrap items-center gap-2", className)}>
      <Badge variant="brand" shape="tag">
        {editoriaLabel(article.editoria)}
      </Badge>
      <span className="type-overline text-muted-foreground">
        Exemplo · {article.readingMinutes} min de leitura
      </span>
    </p>
  )
}

type ArticleCardProps = {
  article: DemoArticle
  /**
   * `feature` = imagem grande e título maior; `standard` = cartão de grade;
   * `compact` = só texto, para listas.
   */
  layout?: "feature" | "standard" | "compact"
  variant?: 0 | 1 | 2
  className?: string
}

/** Cartão de notícia do portal. O link cobre o cartão inteiro. */
export function ArticleCard({
  article,
  layout = "standard",
  variant = 0,
  className,
}: ArticleCardProps) {
  const href = `/noticias/${article.slug}`

  if (layout === "compact") {
    return (
      <article className={cn("group/card relative py-5", className)}>
        <ArticleMeta article={article} />
        <h3 className="type-h3 mt-2.5">
          <Link
            href={href}
            className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-(--duration-slow) ease-emphasized group-hover/card:bg-[length:100%_1px]">
              {article.title}
            </span>
          </Link>
        </h3>
      </article>
    )
  }

  const feature = layout === "feature"

  return (
    <article className={cn("group/card relative flex flex-col", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          feature ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[3/2]"
        )}
      >
        <ArticleVisual
          editoria={article.editoria}
          variant={variant}
          className="size-full transition-transform duration-[900ms] ease-emphasized group-hover/card:scale-[1.04]"
        />
        <span className="absolute right-3 bottom-3 grid size-10 translate-y-2 place-items-center rounded-full bg-background text-foreground opacity-0 shadow-md transition-[opacity,transform] duration-(--duration-base) ease-emphasized group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <ArrowUpRightIcon className="size-4" aria-hidden />
        </span>
      </div>
      <ArticleMeta article={article} className="mt-4" />
      <h3 className={cn("mt-2.5", feature ? "type-h2" : "type-h3")}>
        <Link
          href={href}
          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {article.title}
        </Link>
      </h3>
      <p
        className={cn(
          "mt-2 text-muted-foreground",
          feature ? "type-body" : "type-small"
        )}
      >
        {article.excerpt}
      </p>
    </article>
  )
}
