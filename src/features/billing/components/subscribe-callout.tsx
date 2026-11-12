"use client"

import { ArrowRightIcon, CheckIcon, NewspaperIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { formatCents, getBillingConfig, getMySubscription } from "../data"

const benefits = [
  "Notícias da cidade e do bairro em primeira mão",
  "O jornal impresso entregue na sua casa",
  "Você sustenta o jornalismo feito aqui",
]

/**
 * Chamada em destaque para virar assinante. Some quando a pessoa já tem
 * assinatura (pendente ou ativa); volta a aparecer se ela for cancelada.
 */
export function SubscribeCallout({ onSubscribe }: { onSubscribe: () => void }) {
  const { user } = useAuth()
  const { data } = useAsync(
    () =>
      user
        ? Promise.all([getMySubscription(user.id), getBillingConfig()]).then(
            ([subscription, config]) => ({ subscription, config })
          )
        : Promise.resolve(null),
    [user?.id]
  )

  if (!data) return null
  const status = data.subscription?.status
  if (status === "pendente" || status === "ativa") return null

  const price = data.config.monthly_price_cents

  return (
    <section
      aria-labelledby="seja-assinante"
      // Sempre escuro (superfície "contraste"), nos dois temas; no escuro ganha
      // uma borda amarela para se destacar do fundo da página.
      className="relative overflow-hidden rounded-xl bg-contraste p-6 text-contraste-foreground ring-1 ring-transparent sm:p-8 dark:bg-[oklch(0.2_0_0)] dark:ring-[color:var(--amarelo)]/35"
    >
      <NewspaperIcon
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-8 size-44 text-contraste-foreground/[0.06]"
      />
      <p className="type-overline text-[color:var(--amarelo)]">Seja assinante</p>
      <h2 id="seja-assinante" className="type-h2 mt-2 max-w-md text-balance">
        A notícia de perto precisa de gente como você.
      </h2>
      <ul className="mt-5 space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-sm text-contraste-foreground/85">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-[color:var(--amarelo)]" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="relative mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
        <Button
          size="lg"
          onClick={onSubscribe}
          className="h-14 bg-[color:var(--amarelo)] px-8 text-base font-semibold text-[oklch(0.18_0_0)] hover:bg-[color:var(--amarelo)]/90"
        >
          Quero ser assinante
          <ArrowRightIcon className="size-5" aria-hidden />
        </Button>
        {price > 0 ? (
          <p className="text-sm text-contraste-muted-foreground">
            por apenas{" "}
            <strong className="font-display text-2xl font-medium text-contraste-foreground">
              {formatCents(price)}
            </strong>
            /mês
          </p>
        ) : null}
      </div>
    </section>
  )
}
