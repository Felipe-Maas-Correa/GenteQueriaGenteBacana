import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Botão do Design System. Toda a aparência dos botões da aplicação é definida
 * aqui — altere variantes e tamanhos neste arquivo para refletir em todo o projeto.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-medium whitespace-nowrap outline-none select-none transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-standard focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/88",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)]",
        accent:
          "bg-brand text-brand-foreground shadow-xs hover:bg-[color-mix(in_oklch,var(--brand),var(--foreground)_12%)]",
        outline:
          "border-input bg-transparent text-foreground hover:border-foreground/40 hover:bg-muted aria-expanded:bg-muted",
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_12%)] focus-visible:border-destructive focus-visible:ring-destructive/30",
        "destructive-soft":
          "bg-destructive-soft text-destructive hover:bg-[color-mix(in_oklch,var(--destructive-soft),var(--destructive)_12%)] focus-visible:border-destructive focus-visible:ring-destructive/30",
        link: "h-auto! rounded-sm px-0! text-foreground underline decoration-brand decoration-2 underline-offset-4 hover:text-brand active:scale-100",
      },
      size: {
        sm: "h-(--control-h-sm) rounded-md px-3 text-[0.8125rem] gap-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-(--control-h) px-(--control-px)",
        lg: "h-(--control-h-lg) px-5 text-base",
        "icon-sm":
          "size-(--control-h-sm) rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-(--control-h)",
        "icon-lg": "size-(--control-h-lg) [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Exibe o indicador de carregamento e bloqueia novas interações. */
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <span className="absolute inset-0 grid place-items-center">
            <Loader2Icon className="animate-spin" aria-hidden />
          </span>
          <span className="contents text-transparent [&_svg]:invisible">
            {children}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

export { Button, buttonVariants, type ButtonProps }
