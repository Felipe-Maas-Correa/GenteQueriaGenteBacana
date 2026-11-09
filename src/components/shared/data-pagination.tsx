import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type DataPaginationProps = {
  page: number
  pageCount: number
  /** Monta o endereço de uma página, preservando os filtros atuais. */
  hrefForPage: (page: number) => string
}

/** Sequência compacta de páginas: 1 … 4 5 6 … 20 */
function pageWindow(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b)

  const result: (number | "gap")[] = []
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push("gap")
    result.push(p)
  })
  return result
}

/** Paginação padrão das listagens, baseada em links (funciona sem JavaScript). */
export function DataPagination({
  page,
  pageCount,
  hrefForPage,
}: DataPaginationProps) {
  if (pageCount <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefForPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          />
        </PaginationItem>
        {pageWindow(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <PaginationItem key={`gap-${index}`} className="hidden sm:block">
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem
              key={entry}
              className={entry === page ? undefined : "hidden sm:block"}
            >
              <PaginationLink
                href={hrefForPage(entry)}
                isActive={entry === page}
                aria-label={`Página ${entry}`}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href={hrefForPage(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
