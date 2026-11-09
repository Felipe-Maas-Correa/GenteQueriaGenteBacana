import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon, PrinterIcon, SearchXIcon, UsersIcon } from "lucide-react"

import { DataPagination } from "@/components/shared/data-pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { listAreaOptions } from "@/features/areas/queries"
import { getStaffContext } from "@/features/authentication/session"
import { SubscriberFilters } from "@/features/subscribers/components/subscriber-filters"
import { SubscribersList } from "@/features/subscribers/components/subscribers-list"
import {
  countActiveFilters,
  filtersToSearchParams,
  PAGE_SIZE,
  parseSubscriberFilters,
} from "@/features/subscribers/filters"
import { listSubscribers } from "@/features/subscribers/queries"
import { formatNumber, todayISO } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Assinantes" }

export default function SubscribersPage({
  searchParams,
}: PageProps<"/admin/assinantes">) {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Circulação"
        title="Assinantes"
        description="Cadastre, encontre e organize os assinantes do jornal."
        actions={
          <Button asChild variant="accent">
            <Link href="/admin/assinantes/novo">
              <PlusIcon aria-hidden />
              Novo assinante
            </Link>
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <TableSkeleton />
          </div>
        }
      >
        <SubscribersSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function SubscribersSection({
  searchParams,
}: Pick<PageProps<"/admin/assinantes">, "searchParams">) {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const filters = parseSubscriberFilters(await searchParams)
  const [areas, page] = await Promise.all([
    listAreaOptions(context.supabase),
    listSubscribers(context.supabase, filters),
  ])

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
        <SubscribersList items={page.items} today={todayISO()} />
      ) : hasFilters || page.total > 0 ? (
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
