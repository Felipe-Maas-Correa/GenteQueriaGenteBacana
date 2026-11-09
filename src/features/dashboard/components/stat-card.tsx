import Link from "next/link"
import { ArrowUpRightIcon, type LucideIcon } from "lucide-react"

import { AnimatedNumber } from "@/components/shared/animated-number"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: number
  /** Texto de apoio abaixo do número. */
  detail?: string
  icon: LucideIcon
  /** Destino ao clicar (normalmente a listagem já filtrada). */
  href?: string
  /** Destaca o cartão principal. */
  emphasis?: boolean
}

/** Indicador numérico do dashboard. */
export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  emphasis = false,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            "type-overline",
            emphasis ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <Icon
          className={cn(
            "size-4 shrink-0",
            emphasis ? "text-brand" : "text-muted-foreground"
          )}
          aria-hidden
        />
      </div>
      <p className="font-display text-5xl leading-none font-medium tracking-tight tabular-nums">
        <AnimatedNumber value={value} />
      </p>
      <p
        className={cn(
          "type-caption flex items-center gap-1 font-normal",
          emphasis ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        {detail}
        {href ? (
          <ArrowUpRightIcon
            className="ml-auto size-3.5 opacity-0 transition-opacity group-hover/stat:opacity-100 group-focus-visible/stat:opacity-100"
            aria-hidden
          />
        ) : null}
      </p>
    </>
  )

  const className = cn(
    "group/stat flex flex-col gap-4 rounded-xl border p-5 outline-none transition-[box-shadow,transform,border-color] duration-(--duration-base) ease-standard",
    emphasis
      ? "border-transparent bg-primary text-primary-foreground"
      : "bg-card text-card-foreground",
    href &&
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
  )

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
