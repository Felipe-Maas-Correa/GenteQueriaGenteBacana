import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  /** Ação sugerida (normalmente um botão). */
  action?: React.ReactNode
  className?: string
}

/** Estado vazio padrão: usado quando não há dados ou resultados. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center",
        className
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <h2 className="type-h4">{title}</h2>
        {description ? (
          <p className="type-small mx-auto max-w-md text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
