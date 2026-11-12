import { cn } from "@/lib/utils"

/**
 * Selo de assinante: um "carimbo" azul com a página de jornal do logotipo.
 * Aparece ao lado do nome de quem tem assinatura ativa (nos comentários).
 */
export function SubscriberBadge({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Assinante do jornal"
      title="Assinante do Gente Querida, Gente Bacana"
      className={cn(
        "inline-grid size-4 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground align-[-2px]",
        className
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-2.5">
        {/* página do jornal: cabeçalho, foto e linhas */}
        <rect x="2" y="1.5" width="12" height="13" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="4.5" y="4" width="7" height="1.6" fill="currentColor" />
        <circle cx="6" cy="8.6" r="1.5" fill="currentColor" />
        <rect x="8.5" y="7.6" width="3" height="1.2" fill="currentColor" />
        <rect x="4.5" y="11" width="7" height="1.2" fill="currentColor" />
      </svg>
    </span>
  )
}
