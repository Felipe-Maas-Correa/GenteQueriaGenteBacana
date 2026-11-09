import { cn } from "@/lib/utils"

type LogoMarkProps = React.ComponentProps<"svg"> & { title?: string }

/**
 * Símbolo: dois círculos que se encontram — gente com gente.
 * As cores vêm dos tokens (--brand e currentColor).
 */
export function LogoMark({ className, title, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 44 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("h-8 w-auto shrink-0", className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="16" cy="16" r="14" fill="var(--brand)" />
      <circle
        cx="28"
        cy="16"
        r="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M23.125 3.95A14 14 0 0 1 23.125 28.05A13 13 0 0 1 23.125 3.95Z"
        fill="currentColor"
      />
    </svg>
  )
}

type LogoProps = {
  className?: string
  /** `stacked` quebra o nome em duas linhas; `inline` mantém em uma. */
  layout?: "stacked" | "inline"
  size?: "sm" | "md" | "lg"
}

const sizes = {
  sm: { mark: "h-6", text: "text-[0.95rem]" },
  md: { mark: "h-8", text: "text-xl" },
  lg: { mark: "h-11", text: "text-3xl" },
} as const

/** Logotipo completo: símbolo + nome em Fraunces. */
export function Logo({ className, layout = "stacked", size = "md" }: LogoProps) {
  const s = sizes[size]
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={s.mark} />
      <span
        className={cn(
          "font-display leading-[0.95] tracking-[-0.02em]",
          s.text,
          layout === "stacked" ? "flex flex-col" : "inline-flex gap-[0.3em]"
        )}
      >
        <span className="font-normal italic">Gente Querida,</span>
        <span className="font-semibold">Gente Bacana</span>
      </span>
    </span>
  )
}
