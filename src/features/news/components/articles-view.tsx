"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { HouseIcon, NewspaperIcon, PlusIcon } from "lucide-react"

import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { editoriaLabel } from "@/lib/site"
import { formatDateTime, normalizeSearch } from "@/lib/utils/format"
import { cardSizeLabels } from "@/lib/validations/article"

import { listAllArticles } from "../queries"
import { ArticleImage } from "./article-card"

type StatusFilter = "all" | "published" | "draft"

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Rascunhos" },
]

export function ArticlesView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? listAllArticles() : Promise.resolve(null)),
    [configured]
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const rows = useMemo(() => {
    const term = normalizeSearch(search)
    return (data ?? []).filter(
      (article) =>
        (statusFilter === "all" || article.status === statusFilter) &&
        (!term || normalizeSearch(article.title).includes(term))
    )
  }, [data, search, statusFilter])

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  if (!data?.length) {
    return (
      <EmptyState
        icon={NewspaperIcon}
        title="Nenhuma notícia ainda"
        description="Escreva a primeira notícia. Enquanto nada for publicado, o site mostra o conteúdo de exemplo."
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
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar pelo título…"
          aria-label="Buscar notícias pelo título"
          className="w-full sm:w-80"
        />
        <div className="flex gap-1 rounded-lg border p-1" role="group" aria-label="Filtrar por situação">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={statusFilter === filter.value ? "secondary" : "ghost"}
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notícia</TableHead>
              <TableHead className="hidden md:table-cell">Editoria</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="hidden lg:table-cell">Página inicial</TableHead>
              <TableHead className="hidden sm:table-cell">Atualizada</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((article) => (
              <TableRow key={article.id} className="relative">
                <TableCell className="max-w-md">
                  <div className="flex items-center gap-3">
                    <ArticleImage
                      article={article}
                      className="hidden aspect-[3/2] w-16 shrink-0 rounded-sm sm:block"
                    />
                    <Link
                      href={`/admin/noticias/${article.id}`}
                      className="line-clamp-2 font-medium outline-none after:absolute after:inset-0 hover:text-brand focus-visible:underline"
                    >
                      {article.title}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {editoriaLabel(article.editoria)}
                </TableCell>
                <TableCell>
                  {article.status === "published" ? (
                    <Badge variant="success">Publicada</Badge>
                  ) : (
                    <Badge variant="secondary">Rascunho</Badge>
                  )}
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
                  {formatDateTime(article.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma notícia encontrada com estes filtros.
          </p>
        ) : null}
      </div>
    </div>
  )
}
