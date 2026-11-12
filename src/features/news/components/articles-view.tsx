"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { HouseIcon, NewspaperIcon, PlusIcon, XIcon } from "lucide-react"

import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { useEditorias } from "@/features/editorias/editorias-context"
import { cn } from "@/lib/utils"
import { formatDateTime, normalizeSearch } from "@/lib/utils/format"
import { cardSizeLabels } from "@/lib/validations/article"
import type { Article } from "@/types/database"

import { listAllArticles } from "../queries"
import { ArticleImage } from "./article-card"
import { routes } from "@/lib/routes"

type Situation = "published" | "scheduled" | "draft"
type StatusFilter = "all" | Situation
type SortKey = "updated" | "published" | "title"

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "published", label: "Publicadas" },
  { value: "scheduled", label: "Agendadas" },
  { value: "draft", label: "Rascunhos" },
]

const sortLabels: Record<SortKey, string> = {
  updated: "Última edição",
  published: "Data de publicação",
  title: "Título (A–Z)",
}

function situationOf(article: Article, now: number): Situation {
  if (article.status === "draft") return "draft"
  return article.published_at && new Date(article.published_at).getTime() > now
    ? "scheduled"
    : "published"
}

function SituationBadge({ article, situation }: { article: Article; situation: Situation }) {
  if (situation === "draft") return <Badge variant="secondary">Rascunho</Badge>
  if (situation === "scheduled") {
    return (
      <span className="grid gap-0.5">
        <Badge variant="info">Agendada</Badge>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(article.published_at)}
        </span>
      </span>
    )
  }
  return <Badge variant="success">Publicada</Badge>
}

export function ArticlesView() {
  const { status } = useAuth()
  const { editorias, label } = useEditorias()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured
        ? listAllArticles().then((articles) => ({ articles, now: Date.now() }))
        : Promise.resolve(null),
    [configured]
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [editoria, setEditoria] = useState("all")
  const [onlyHome, setOnlyHome] = useState(false)
  const [sort, setSort] = useState<SortKey>("updated")

  const rows = useMemo(() => {
    if (!data) return []
    return data.articles.map((article) => ({
      article,
      situation: situationOf(article, data.now),
    }))
  }, [data])

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: rows.length,
      published: 0,
      scheduled: 0,
      draft: 0,
    }
    for (const row of rows) result[row.situation] += 1
    return result
  }, [rows])

  const visible = useMemo(() => {
    const term = normalizeSearch(search)
    const filtered = rows.filter(
      ({ article, situation }) =>
        (statusFilter === "all" || situation === statusFilter) &&
        (editoria === "all" || article.editoria === editoria) &&
        (!onlyHome || article.on_home) &&
        (!term ||
          normalizeSearch(article.title).includes(term) ||
          normalizeSearch(article.author).includes(term))
    )
    return filtered.sort((a, b) => {
      if (sort === "title") return a.article.title.localeCompare(b.article.title, "pt-BR")
      if (sort === "published") {
        return (b.article.published_at || "").localeCompare(a.article.published_at || "")
      }
      return b.article.updated_at.localeCompare(a.article.updated_at)
    })
  }, [rows, search, statusFilter, editoria, onlyHome, sort])

  const filtersActive =
    search !== "" || statusFilter !== "all" || editoria !== "all" || onlyHome

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setEditoria("all")
    setOnlyHome(false)
  }

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  if (!rows.length) {
    return (
      <EmptyState
        icon={NewspaperIcon}
        title="Nenhuma notícia ainda"
        description="Escreva a primeira notícia. Ela aparece no site assim que for publicada."
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

  return (
    <div className="space-y-4">
      {/* Situação com contadores */}
      <div
        role="tablist"
        aria-label="Filtrar por situação"
        className="flex flex-wrap gap-1 border-b"
      >
        {statusTabs.map((tab) => {
          const active = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  active ? "bg-foreground text-background" : "bg-muted"
                )}
              >
                {counts[tab.value]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Busca, editoria, capa e ordenação */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por título ou autor…"
          aria-label="Buscar notícias por título ou autor"
          className="w-full sm:w-72"
        />
        <Select value={editoria} onValueChange={setEditoria}>
          <SelectTrigger className="w-44" aria-label="Filtrar por editoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as editorias</SelectItem>
            {editorias.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={onlyHome ? "secondary" : "outline"}
          aria-pressed={onlyHome}
          onClick={() => setOnlyHome((value) => !value)}
        >
          <HouseIcon aria-hidden />
          Na página inicial
        </Button>
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger className="w-52 sm:ml-auto" aria-label="Ordenar por">
            <span className="text-muted-foreground">Ordenar:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {sortLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="type-caption text-muted-foreground" aria-live="polite">
        {visible.length === rows.length
          ? `${rows.length} ${rows.length === 1 ? "notícia" : "notícias"}`
          : `${visible.length} de ${rows.length} notícias`}
        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-3 inline-flex items-center gap-1 text-brand hover:underline"
          >
            <XIcon className="size-3" aria-hidden />
            Limpar filtros
          </button>
        ) : null}
      </p>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notícia</TableHead>
              <TableHead className="hidden md:table-cell">Editoria</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="hidden lg:table-cell">Página inicial</TableHead>
              <TableHead className="hidden sm:table-cell">
                {sort === "published" ? "Publicação" : "Atualizada"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map(({ article, situation }) => (
              <TableRow key={article.id} className="relative">
                <TableCell className="max-w-md">
                  <div className="flex items-center gap-3">
                    <ArticleImage
                      article={article}
                      className="hidden aspect-[3/2] w-16 shrink-0 rounded-sm sm:block"
                    />
                    <div className="min-w-0">
                      <Link
                        href={routes.editArticle(article.id)}
                        className="line-clamp-2 font-medium outline-none after:absolute after:inset-0 hover:text-brand focus-visible:underline"
                      >
                        {article.title}
                      </Link>
                      {article.author ? (
                        <p className="text-xs text-muted-foreground">{article.author}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {label(article.editoria) || "—"}
                </TableCell>
                <TableCell>
                  <SituationBadge article={article} situation={situation} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {article.on_home ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <HouseIcon className="size-3.5 text-brand" aria-hidden />
                      {cardSizeLabels[article.card_size]}
                      {article.show_image ? " · com foto" : " · sem foto"}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDateTime(
                    sort === "published" ? article.published_at : article.updated_at
                  ) || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma notícia encontrada com estes filtros.{" "}
            <button type="button" onClick={clearFilters} className="text-brand hover:underline">
              Limpar filtros
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
