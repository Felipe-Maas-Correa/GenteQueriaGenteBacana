import Link from "next/link"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/utils/format"
import { MONTHS } from "@/lib/utils/months"

function share(count: number, total: number): string {
  if (total === 0) return "0%"
  return `${((count / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
}

type AreaDatum = { id: string; name: string; count: number }

/**
 * Assinantes por área — barras horizontais, uma única cor (magnitude),
 * com o valor escrito ao lado de cada barra.
 */
export function AreaDistribution({
  data,
  total,
}: {
  data: AreaDatum[]
  total: number
}) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <ul className="grid gap-3">
      {data.map((area) => (
        <li key={area.id}>
          <Link
            href={`/admin/assinantes?area=${area.id}`}
            className="group/bar grid gap-1.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            title={`Ver assinantes da área ${area.name}`}
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="type-small truncate font-medium group-hover/bar:underline">
                {area.name}
              </span>
              <span className="type-data shrink-0 text-muted-foreground">
                {formatNumber(area.count)}
                <span className="ml-2 inline-block w-12 text-right">
                  {share(area.count, total)}
                </span>
              </span>
            </span>
            <span className="block h-2 rounded-full bg-muted" aria-hidden>
              <span
                className="block h-full rounded-full bg-chart-1 transition-[width] duration-(--duration-slow) ease-emphasized"
                style={{
                  width: `${(area.count / max) * 100}%`,
                  minWidth: area.count > 0 ? "0.5rem" : 0,
                }}
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

type MonthDatum = { month: number; count: number }

/**
 * Assinantes por mês de referência — colunas em uma única cor.
 * O valor aparece sobre cada coluna e também no tooltip/rótulo acessível.
 */
export function MonthDistribution({
  data,
  total,
}: {
  data: MonthDatum[]
  total: number
}) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <ol className="grid h-56 grid-cols-12 items-end gap-[2px] sm:gap-2">
      {MONTHS.map((month) => {
        const count = data.find((d) => d.month === month.value)?.count ?? 0
        const label = `${month.label}: ${formatNumber(count)} assinante${count === 1 ? "" : "s"} (${share(count, total)})`
        return (
          <li key={month.value} className="flex h-full min-w-0 flex-col">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/admin/assinantes?mes=${month.value}`}
                  aria-label={label}
                  className="group/col flex min-h-0 flex-1 flex-col justify-end rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span
                    className="type-data mb-1 text-center text-[0.6875rem] text-muted-foreground"
                    aria-hidden
                  >
                    {count > 0 ? formatNumber(count) : ""}
                  </span>
                  <span
                    aria-hidden
                    className="block w-full rounded-t-[4px] bg-chart-2 transition-[height,opacity] duration-(--duration-slow) ease-emphasized group-hover/col:opacity-80"
                    style={{
                      height: `${(count / max) * 100}%`,
                      minHeight: count > 0 ? "4px" : "1px",
                    }}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
            <span
              className="type-overline mt-2 block truncate border-t pt-2 text-center text-[0.625rem] tracking-[0.06em] text-muted-foreground"
              aria-hidden
            >
              {month.short}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
