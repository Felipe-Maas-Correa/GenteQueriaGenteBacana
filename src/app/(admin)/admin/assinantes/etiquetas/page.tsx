import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon, InfoIcon, TagsIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { TableSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getStaffContext } from "@/features/authentication/session"
import { LabelSheet } from "@/features/subscribers/components/label-sheet"
import {
  countActiveFilters,
  filtersToSearchParams,
  parseSubscriberFilters,
} from "@/features/subscribers/filters"
import {
  listSubscribersForLabels,
  MAX_LABELS,
} from "@/features/subscribers/queries"
import { formatNumber } from "@/lib/utils/format"

export const metadata: Metadata = { title: "Etiquetas" }

export default function LabelsPage({
  searchParams,
}: PageProps<"/admin/assinantes/etiquetas">) {
  return (
    <div className="space-y-6 print:space-y-0">
      <PageHeader
        overline="Assinantes"
        title="Etiquetas"
        description="Escolha as informações e o modelo da folha, confira a prévia e imprima."
      />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <LabelsSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function LabelsSection({
  searchParams,
}: Pick<PageProps<"/admin/assinantes/etiquetas">, "searchParams">) {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const filters = parseSubscriberFilters(await searchParams)
  const { items, withoutLabel, truncated } = await listSubscribersForLabels(
    context.supabase,
    filters
  )

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

      {withoutLabel > 0 || truncated ? (
        <Alert variant="info" className="print:hidden">
          <InfoIcon aria-hidden />
          <AlertDescription>
            {withoutLabel > 0 ? (
              <p>
                {formatNumber(withoutLabel)}{" "}
                {withoutLabel === 1
                  ? "assinante deste resultado está marcado para não gerar etiqueta e ficou de fora."
                  : "assinantes deste resultado estão marcados para não gerar etiqueta e ficaram de fora."}
              </p>
            ) : null}
            {truncated ? (
              <p>
                O resultado tem mais de {formatNumber(MAX_LABELS)} etiquetas.
                Apenas as primeiras {formatNumber(MAX_LABELS)} foram
                carregadas — refine os filtros para imprimir em lotes.
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {items.length > 0 ? (
        <LabelSheet subscribers={items} />
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
