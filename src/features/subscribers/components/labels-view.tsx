"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeftIcon, InfoIcon, TagsIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { formatNumber } from "@/lib/utils/format"

import {
  countActiveFilters,
  filtersToSearchParams,
  parseSubscriberFilters,
} from "../filters"
import { listSubscribersForLabels, MAX_LABELS } from "../queries"
import { LabelSheet } from "./label-sheet"

export function LabelsView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const searchParams = useSearchParams()
  const key = searchParams.toString()
  const filters = parseSubscriberFilters(Object.fromEntries(searchParams))

  const { data, loading, error, reload } = useAsync(
    () =>
      configured ? listSubscribersForLabels(filters) : Promise.resolve(null),
    [configured, key]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const backParams = filtersToSearchParams({ ...filters, pagina: 1 }).toString()
  const backHref = `/admin/assinantes${backParams ? `?${backParams}` : ""}`
  const filterCount = countActiveFilters(filters)

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href={backHref}>
            <ArrowLeftIcon aria-hidden />
            Voltar para a listagem
          </Link>
        </Button>
        <p className="type-small text-muted-foreground" role="status">
          {filterCount > 0
            ? `Usando ${filterCount} filtro${filterCount === 1 ? "" : "s"} da listagem`
            : "Sem filtros: todos os assinantes"}
        </p>
      </div>

      {data.withoutLabel > 0 || data.truncated ? (
        <Alert variant="info" className="print:hidden">
          <InfoIcon aria-hidden />
          <AlertDescription>
            {data.withoutLabel > 0 ? (
              <p>
                {formatNumber(data.withoutLabel)}{" "}
                {data.withoutLabel === 1
                  ? "assinante deste resultado está marcado para não gerar etiqueta e ficou de fora."
                  : "assinantes deste resultado estão marcados para não gerar etiqueta e ficaram de fora."}
              </p>
            ) : null}
            {data.truncated ? (
              <p>
                O resultado tem mais de {formatNumber(MAX_LABELS)} etiquetas.
                Apenas as primeiras {formatNumber(MAX_LABELS)} foram carregadas —
                refine os filtros para imprimir em lotes.
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {data.items.length > 0 ? (
        <LabelSheet subscribers={data.items} />
      ) : (
        <EmptyState
          icon={TagsIcon}
          title="Nenhuma etiqueta para gerar"
          description="Nenhum assinante com etiqueta habilitada corresponde aos filtros atuais."
          action={
            <Button asChild variant="outline">
              <Link href={backHref}>Voltar para a listagem</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
