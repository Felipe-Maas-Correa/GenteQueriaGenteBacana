"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeOffIcon,
  LayoutTemplateIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { editoriaLabel } from "@/lib/site"
import type { Article } from "@/types/database"

import { saveHomeLayout } from "../actions"
import { byHomeOrder, listAllArticles } from "../queries"
import { ArticleImage, HomeGrid } from "./article-card"
import { CardSizePicker } from "./card-controls"

export function HomeLayoutView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? listAllArticles() : Promise.resolve(null)),
    [configured]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  const published = (data ?? []).filter((a) => a.status === "published")
  if (!published.length) {
    return (
      <EmptyState
        icon={LayoutTemplateIcon}
        title="Nenhuma notícia publicada"
        description="Publique ao menos uma notícia para montar a página inicial. Até lá, o site mostra o conteúdo de exemplo."
        action={
          <Button asChild>
            <Link href="/admin/noticias/nova">
              <PlusIcon aria-hidden />
              Nova notícia
            </Link>
          </Button>
        }
      />
    )
  }

  // `key` reinicia o editor com os dados salvos após cada gravação.
  return (
    <HomeLayoutEditor
      key={published.map((a) => a.id + a.updated_at).join()}
      articles={published}
      onSaved={reload}
    />
  )
}

function HomeLayoutEditor({
  articles,
  onSaved,
}: {
  articles: Article[]
  onSaved: () => void
}) {
  const initial = useMemo(
    () => ({
      home: articles.filter((a) => a.on_home).sort(byHomeOrder),
      others: articles.filter((a) => !a.on_home),
    }),
    [articles]
  )
  const [home, setHome] = useState(initial.home)
  const [others, setOthers] = useState(initial.others)
  const [saving, startSaving] = useTransition()
  const [dirty, setDirty] = useState(false)

  const update = (next: Article[], nextOthers = others) => {
    setHome(next)
    setOthers(nextOthers)
    setDirty(true)
  }

  const patch = (id: string, changes: Partial<Article>) =>
    update(home.map((a) => (a.id === id ? { ...a, ...changes } : a)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= home.length) return
    const next = [...home]
    ;[next[index], next[target]] = [next[target], next[index]]
    update(next)
  }

  const removeFromHome = (article: Article) =>
    update(
      home.filter((a) => a.id !== article.id),
      [{ ...article, on_home: false }, ...others]
    )

  const addToHome = (article: Article) =>
    update(
      [...home, { ...article, on_home: true }],
      others.filter((a) => a.id !== article.id)
    )

  const save = () =>
    startSaving(async () => {
      const result = await saveHomeLayout([
        ...home.map((a) => ({ ...a, on_home: true })),
        ...others.map((a) => ({ ...a, on_home: false })),
      ])
      if (result.ok) {
        toast.success(result.message)
        setDirty(false)
        onSaved()
      } else {
        toast.error(result.message)
      }
    })

  const discard = () => {
    setHome(initial.home)
    setOthers(initial.others)
    setDirty(false)
  }

  return (
    <div className="grid gap-8 2xl:grid-cols-[30rem_minmax(0,1fr)]">
      {/* ── Lista de cartões ─────────────────────────────────── */}
      <div className="space-y-6">
        <section className="space-y-3">
          <header className="flex items-baseline justify-between">
            <h2 className="type-h4">Na página inicial</h2>
            <span className="type-caption text-muted-foreground">
              {home.length} {home.length === 1 ? "notícia" : "notícias"} · de cima para baixo
            </span>
          </header>

          {home.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma notícia na página inicial. Adicione abaixo.
            </p>
          ) : (
            <ol className="space-y-2">
              {home.map((article, index) => (
                <li key={article.id} className="space-y-3 rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <span className="type-overline mt-1 w-5 shrink-0 text-center text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{article.title}</p>
                      <p className="type-caption text-muted-foreground">
                        {editoriaLabel(article.editoria)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Subir"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpIcon aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Descer"
                        disabled={index === home.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon aria-hidden />
                      </Button>
                      <Button asChild size="icon-sm" variant="ghost" aria-label="Editar notícia">
                        <Link href={`/admin/noticias/${article.id}`}>
                          <PencilIcon aria-hidden />
                        </Link>
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Tirar da página inicial"
                        onClick={() => removeFromHome(article)}
                      >
                        <EyeOffIcon aria-hidden />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pl-8">
                    <CardSizePicker
                      compact
                      value={article.card_size}
                      onChange={(card_size) => patch(article.id, { card_size })}
                      label={`Tamanho do cartão: ${article.title}`}
                    />
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={article.show_image}
                          onCheckedChange={(show_image) => patch(article.id, { show_image })}
                        />
                        Com foto
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Switch
                          checked={article.show_excerpt}
                          onCheckedChange={(show_excerpt) =>
                            patch(article.id, { show_excerpt })
                          }
                        />
                        Com linha fina
                      </label>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {others.length ? (
          <section className="space-y-3">
            <h2 className="type-h4">Publicadas fora da página inicial</h2>
            <ul className="divide-y rounded-lg border bg-card">
              {others.map((article) => (
                <li key={article.id} className="flex items-center gap-3 p-3">
                  <ArticleImage article={article} className="aspect-[3/2] w-14 shrink-0 rounded-sm" />
                  <p className="line-clamp-2 min-w-0 flex-1 text-sm">{article.title}</p>
                  <Button size="sm" variant="outline" onClick={() => addToHome(article)}>
                    <PlusIcon aria-hidden />
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 2xl:mx-0 2xl:px-0">
          <span className="type-caption text-muted-foreground">
            {dirty ? "Alterações não salvas" : "Tudo salvo"}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" disabled={!dirty || saving} onClick={discard}>
              <RotateCcwIcon aria-hidden />
              Desfazer
            </Button>
            <Button variant="accent" loading={saving} disabled={!dirty} onClick={save}>
              Salvar página inicial
            </Button>
          </div>
        </div>
      </div>

      {/* ── Prévia ao vivo ───────────────────────────────────── */}
      <section aria-label="Prévia da página inicial" className="min-w-0 space-y-3">
        <header className="flex items-baseline justify-between">
          <h2 className="type-h4">Prévia</h2>
          <Link href="/" target="_blank" className="type-caption text-brand hover:underline">
            Abrir o site
          </Link>
        </header>
        <div className="pointer-events-none overflow-hidden rounded-xl border bg-background p-6 [zoom:0.55] sm:p-10">
          {home.length ? (
            <HomeGrid articles={home} />
          ) : (
            <p className="py-20 text-center text-muted-foreground">Página inicial vazia</p>
          )}
        </div>
      </section>
    </div>
  )
}
