import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent font-medium whitespace-nowrap transition-colors duration-(--duration-fast) [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        brand: "bg-brand-soft text-brand",
        support: "bg-support-soft text-support",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        info: "bg-info-soft text-info",
        destructive: "bg-destructive-soft text-destructive",
      },
      /** `badge` = indicador de estado (pílula); `tag` = rótulo editorial (reto, caixa alta). */
      shape: {
        badge: "h-5.5 rounded-full px-2 text-xs",
        tag: "h-5.5 rounded-sm px-1.5 font-mono text-[0.6875rem] tracking-[0.1em] uppercase",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "badge",
    },
  }
)

function Badge({
  className,
  variant = "default",
  shape = "badge",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
