import { cn } from "@/lib/utils"

type LogoMarkProps = React.ComponentProps<"svg"> & { title?: string }

/**
 * Símbolo: a primeira página de um jornal — cabeçalho, colunas de texto e,
 * no lugar da foto, um círculo azul: a gente que é notícia.
 * As cores vêm dos tokens (--brand e currentColor).
 */
export function LogoMark({ className, title, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("h-8 w-auto shrink-0", className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Página dobrada (verso) */}
      <path d="M7 6V3.5A1.5 1.5 0 0 1 8.5 2H29.5A1.5 1.5 0 0 1 31 3.5V25" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      {/* Página da frente */}
      <rect x="1.75" y="5.75" width="25.5" height="24.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      {/* Cabeçalho do jornal */}
      <rect x="5.5" y="9.5" width="18" height="3" fill="currentColor" />
      {/* Foto: gente */}
      <circle cx="10.25" cy="19.25" r="4.25" fill="var(--brand)" />
      {/* Colunas de texto */}
      <rect x="16.5" y="15.25" width="7" height="1.6" fill="currentColor" />
      <rect x="16.5" y="18.45" width="7" height="1.6" fill="currentColor" />
      <rect x="16.5" y="21.65" width="7" height="1.6" fill="currentColor" />
      <rect x="5.5" y="25.25" width="18" height="1.6" fill="currentColor" />
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
