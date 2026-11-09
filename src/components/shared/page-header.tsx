import { cn } from "@/lib/utils"

type PageHeaderProps = {
  /** Rótulo curto acima do título (ex.: nome do módulo). */
  overline?: string
  title: string
  description?: React.ReactNode
  /** Ações principais da página (botões). */
  actions?: React.ReactNode
  className?: string
}

/** Cabeçalho padrão das páginas do painel. */
export function PageHeader({
  overline,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between print:hidden",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {overline ? (
          <p className="type-overline text-brand">{overline}</p>
        ) : null}
        <h1 className="type-h2">{title}</h1>
        {description ? (
          <p className="type-small max-w-2xl text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
