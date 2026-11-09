import { Badge } from "@/components/ui/badge"
import { diffInDays, formatDate } from "@/lib/utils/format"
import type { SubscriberStatus } from "@/types/database"

export const statusLabels: Record<SubscriberStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
}

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <Badge variant={status === "active" ? "success" : "secondary"}>
      <span
        className="size-1.5 rounded-full bg-current"
        aria-hidden
      />
      {statusLabels[status]}
    </Badge>
  )
}

/** Data de vencimento com indicação de atraso ou proximidade. */
export function DueDate({
  date,
  today,
  active = true,
}: {
  date: string
  /** Data de hoje (AAAA-MM-DD), calculada no servidor. */
  today: string
  active?: boolean
}) {
  const days = diffInDays(today, date)
  const hint = !active
    ? null
    : days < 0
      ? { label: "Vencido", variant: "destructive" as const }
      : days === 0
        ? { label: "Vence hoje", variant: "warning" as const }
        : days <= 7
          ? { label: `Em ${days} dia${days === 1 ? "" : "s"}`, variant: "warning" as const }
          : null

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <time dateTime={date} className="type-data whitespace-nowrap">
        {formatDate(date)}
      </time>
      {hint ? <Badge variant={hint.variant}>{hint.label}</Badge> : null}
    </span>
  )
}
