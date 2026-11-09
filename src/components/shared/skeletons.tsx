import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Esqueleto genérico de página do painel (cabeçalho + conteúdo). */
export function PageSkeleton() {
  return (
    <div className="space-y-8" aria-busy aria-label="Carregando">
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <TableSkeleton />
    </div>
  )
}

/** Esqueleto de listagem em tabela. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-card"
      aria-busy
      aria-label="Carregando dados"
    >
      <div className="border-b bg-muted/40 px-4 py-3.5">
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b px-4 py-4 last:border-0"
        >
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="hidden h-4 w-1/5 sm:block" />
          <Skeleton className="hidden h-4 w-1/6 md:block" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Esqueleto de cartões em grade (ex.: indicadores). */
export function CardGridSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      aria-busy
      aria-label="Carregando indicadores"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-4 rounded-xl border bg-card p-5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  )
}
