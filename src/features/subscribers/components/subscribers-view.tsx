"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { PlusIcon, PrinterIcon, SearchXIcon, UsersIcon } from "lucide-react"

import { DataPagination } from "@/components/shared/data-pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listAreaOptions, type AreaOption } from "@/features/areas/queries"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { formatNumber, todayISO } from "@/lib/utils/format"

import {
  countActiveFilters,
  filtersToSearchParams,
  PAGE_SIZE,
  parseSubscriberFilters,
} from "../filters"
import { listSubscribers, type SubscriberPage } from "../queries"
import { SubscriberFilters } from "./subscriber-filters"
import { SubscribersList } from "./subscribers-list"

type Loaded = { areas: AreaOption[]; page: SubscriberPage }

export function SubscribersView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const searchParams = useSearchParams()
  const key = searchParams.toString()
  const filters = parseSubscriberFilters(Object.fromEntries(searchParams))

  const { data, loading, error, reload } = useAsync<Loaded | null>(
    () =>
      configured
        ? Promise.all([listAreaOptions(), listSubscribers(filters)]).then(
            ([areas, page]) => ({ areas, page })
          )
        : Promise.resolve(null),
    [configured, key]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <TableSkeleton />
      </div>
    )
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const { areas, page } = data
  const hasFilters = countActiveFilters(filters) > 0
  const query = (overrides: { pagina?: number } = {}) => {
    const params = filtersToSearchParams({ ...filters, ...overrides }).toString()
    return params ? `?${params}` : ""
  }
  const labelsHref = `/admin/assinantes/etiquetas${query({ pagina: 1 })}`
  const firstItem = (page.page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page.page * PAGE_SIZE, page.total)

  return (
    <div className="space-y-4">
      <SubscriberFilters areas={areas} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-small text-muted-foreground" role="status">
          <strong className="font-semibold text-foreground tabular-nums">
            {formatNumber(page.total)}
          </strong>{" "}
          {page.total === 1 ? "assinante encontrado" : "assinantes encontrados"}
          {page.items.length > 0 && page.pageCount > 1 ? (
            <span className="tabular-nums">
              {" "}
              · exibindo {formatNumber(firstItem)}–{formatNumber(lastItem)}
            </span>
          ) : null}
        </p>
        {page.total > 0 ? (
          <Button asChild variant="outline">
            <Link href={labelsHref}>
              <PrinterIcon aria-hidden />
              Gerar etiquetas
            </Link>
          </Button>
        ) : null}
      </div>

      {page.items.length > 0 ? (
        <SubscribersList items={page.items} today={todayISO()} onChanged={reload} />
      ) : hasFilters ? (
        <EmptyState
          icon={SearchXIcon}
          title="Nenhum assinante encontrado"
          description="Nenhum cadastro corresponde à pesquisa e aos filtros atuais. Ajuste os critérios ou limpe os filtros."
          action={
            <Button asChild variant="outline">
              <Link href="/admin/assinantes">Limpar filtros</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum assinante cadastrado"
          description={
            areas.length === 0
              ? "Comece cadastrando as áreas de atendimento e, em seguida, os assinantes."
              : "Cadastre o primeiro assinante para começar a organizar a base."
          }
          action={
            areas.length === 0 ? (
              <Button asChild>
                <Link href="/admin/areas">Cadastrar áreas</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/admin/assinantes/novo">
                  <PlusIcon aria-hidden />
                  Cadastrar assinante
                </Link>
              </Button>
            )
          }
        />
      )}

      <DataPagination
        page={page.page}
        pageCount={page.pageCount}
        hrefForPage={(pagina) => `/admin/assinantes${query({ pagina })}`}
      />
    </div>
  )
}
