import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal"
import { Parallax, ScrollMarquee } from "@/components/shared/scroll-effects"
import { Button } from "@/components/ui/button"
import {
  ArticleCard,
  ArticleMeta,
} from "@/features/news/components/article-card"
import { ArticleVisual } from "@/features/news/components/article-visual"
import { demoArticles } from "@/features/news/demo-articles"
import { editorias } from "@/lib/site"

export default function HomePage() {
  const [lead, second, third, ...rest] = demoArticles
  const latest = rest.slice(0, 4)

  return (
    <>
      {/* Manchete */}
      <section className="page-container pt-8 pb-16 sm:pt-12 lg:pb-24">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7 lg:pt-6">
            <ArticleMeta article={lead} />
            <h1 className="type-hero mt-5">
              <Link
                href={`/noticias/${lead.slug}`}
                className="rounded-sm outline-none transition-colors duration-(--duration-base) hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {lead.title}
              </Link>
            </h1>
            <p className="type-lead mt-6 max-w-xl text-muted-foreground">
              {lead.excerpt}
            </p>
            <Button asChild variant="accent" size="lg" className="group/cta mt-8">
              <Link href={`/noticias/${lead.slug}`}>
                Ler a matéria
                <ArrowRightIcon
                  className="transition-transform duration-(--duration-base) ease-emphasized group-hover/cta:translate-x-1"
                  aria-hidden
                />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-5">
            <Parallax className="aspect-[4/5] rounded-2xl sm:aspect-[16/10] lg:aspect-[4/5]">
              <ArticleVisual editoria={lead.editoria} className="size-full" />
            </Parallax>
          </Reveal>
        </div>

        <RevealGroup className="mt-12 grid gap-x-10 border-t md:grid-cols-2 lg:mt-16">
          {[second, third].map((article) => (
            <RevealItem
              key={article.slug}
              className="border-b md:border-b-0 md:odd:border-r md:odd:pr-10"
            >
              <ArticleCard article={article} layout="compact" />
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Faixa de editorias */}
      <ScrollMarquee
        items={editorias.map((editoria) => editoria.label)}
        className="border-y bg-muted py-8 sm:py-10"
      />

      {/* Últimas */}
      <section className="page-container py-16 lg:py-24">
        <Reveal
          as="header"
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="type-overline text-brand">Últimas</p>
            <h2 className="type-h1 mt-2">O que está acontecendo</h2>
          </div>
          <Button asChild variant="link">
            <Link href="/noticias">Ver todas as notícias</Link>
          </Button>
        </Reveal>

        <RevealGroup className="grid gap-x-8 gap-y-12 md:grid-cols-6">
          <RevealItem className="md:col-span-4">
            <ArticleCard article={latest[0]} layout="feature" variant={1} />
          </RevealItem>
          <RevealItem className="md:col-span-2 md:pt-16">
            <ArticleCard article={latest[1]} variant={2} />
          </RevealItem>
          <RevealItem className="md:col-span-3">
            <ArticleCard article={latest[2]} variant={2} />
          </RevealItem>
          <RevealItem className="md:col-span-3 md:pt-10">
            <ArticleCard article={latest[3]} variant={1} />
          </RevealItem>
        </RevealGroup>
      </section>

      {/* Manifesto */}
      <section className="bg-primary text-primary-foreground">
        <div className="page-container grid gap-10 py-20 lg:grid-cols-12 lg:py-28">
          <Reveal className="lg:col-span-3">
            <p className="type-overline text-brand">O jornal</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-9">
            <p className="type-h1 max-w-4xl">
              Notícia de perto, contada por quem vive aqui —{" "}
              <em className="font-normal text-brand">
                com nome, endereço e gente de verdade.
              </em>
            </p>
            <p className="type-lead mt-8 max-w-2xl text-primary-foreground/70">
              O Gente Querida, Gente Bacana nasce para acompanhar o dia a dia da
              comunidade: o que muda na cidade, quem faz a diferença no bairro e
              o que vale a pena saber antes de sair de casa.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
