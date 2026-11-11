import { LogoMark } from "@/components/shared/logo"
import { cn } from "@/lib/utils"

/** Cor-base de cada editoria (tokens do Design System). */
const editoriaTone: Record<string, string> = {
  cidade: "var(--azul)",
  comunidade: "var(--vermelho)",
  cultura: "var(--chart-3)",
  esporte: "var(--chart-4)",
  opiniao: "var(--tinta-suave)",
}

type ArticleVisualProps = {
  editoria: string
  className?: string
  /** Variação da composição, para que cartões vizinhos não fiquem idênticos. */
  variant?: 0 | 1 | 2
}

const markPosition = [
  "-right-[12%] -bottom-[30%] h-[120%]",
  "-left-[18%] -top-[25%] h-[110%]",
  "right-[8%] top-[12%] h-[70%]",
] as const

/**
 * Arte gerada que ocupa o lugar da foto quando a notícia não tem imagem
 * cadastrada. É decorativa.
 */
export function ArticleVisual({
  editoria,
  className,
  variant = 0,
}: ArticleVisualProps) {
  const tone = editoriaTone[editoria] ?? "var(--tinta-suave)"

  return (
    <div
      aria-hidden
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, color-mix(in oklch, ${tone} 88%, var(--tinta)), color-mix(in oklch, ${tone} 55%, var(--papel)))`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgb(255 255 255 / 0.9) 1px, transparent 1.6px)",
          backgroundSize: "9px 9px",
          maskImage:
            variant === 1
              ? "linear-gradient(200deg, black, transparent 75%)"
              : "linear-gradient(20deg, black, transparent 75%)",
        }}
      />
      <LogoMark
        className={cn(
          "absolute w-auto text-white/25 opacity-70 [--brand:rgb(255_255_255/0.18)]",
          markPosition[variant]
        )}
      />
    </div>
  )
}
