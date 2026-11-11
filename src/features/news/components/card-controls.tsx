"use client"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  CARD_SIZES,
  cardSizeHints,
  cardSizeLabels,
} from "@/lib/validations/article"
import type { CardSize } from "@/types/database"

/** Miniatura do formato do cartão, para o seletor de tamanho. */
function SizeGlyph({ size }: { size: CardSize }) {
  const filled = { hero: 12, large: 8, small: 4 }[size]
  return (
    <span className="grid h-5 w-12 grid-cols-12 gap-px" aria-hidden>
      <span
        className="rounded-[2px] bg-current"
        style={{ gridColumn: `span ${filled} / span ${filled}` }}
      />
    </span>
  )
}

/** Seletor segmentado de tamanho do cartão (Manchete, Grande, Pequeno). */
export function CardSizePicker({
  value,
  onChange,
  compact = false,
  label = "Tamanho do cartão",
}: {
  value: CardSize
  onChange: (size: CardSize) => void
  compact?: boolean
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-1.5">
      {CARD_SIZES.map((size) => {
        const active = value === size
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={active}
            title={cardSizeHints[size]}
            onClick={() => onChange(size)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border px-2 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
              compact ? "py-1.5" : "py-2.5",
              active
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {compact ? null : <SizeGlyph size={size} />}
            {cardSizeLabels[size]}
          </button>
        )
      })}
    </div>
  )
}

/** Linha com rótulo e interruptor (foto, linha fina, página inicial…). */
export function SwitchRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  id: string
  title: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 py-1",
        className
      )}
    >
      <span className="space-y-0.5">
        <span className="type-small block font-medium">{title}</span>
        {description ? (
          <span className="type-caption block font-normal text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  )
}
