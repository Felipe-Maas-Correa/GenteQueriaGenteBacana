"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { LockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/authentication/auth-context"
import { cn } from "@/lib/utils"

import { articleProseClass } from "../article-body"

/** Camadas de desfoque crescente: o texto vai do legível ao borrado. */
const BLUR_STEPS = [0.4, 0.8, 1.5, 2.5, 4, 6, 8, 10]

/**
 * Desfoque progressivo (de cima para baixo) sobre o que estiver atrás.
 * Cada camada começa um pouco mais abaixo e borra um pouco mais.
 */
export function ProgressiveBlur({ className }: { className?: string }) {
  const step = 100 / BLUR_STEPS.length
  return (
    <div aria-hidden className={cn("pointer-events-none", className)}>
      {BLUR_STEPS.map((blur, index) => {
        const start = index * step
        const mask = `linear-gradient(to bottom, transparent ${start}%, black ${start + step}%)`
        return (
          <div
            key={blur}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Texto de enfeite, sempre borrado, no lugar da parte fechada. Não é a
 * notícia: o texto verdadeiro nem chega ao navegador de quem não assina.
 */
const FILLER = [
  "Moradores e autoridades acompanharam de perto cada detalhe da situação ao longo do dia, e as informações foram sendo confirmadas aos poucos pela equipe de reportagem que esteve no local conversando com quem viveu tudo de perto.",
  "Segundo os relatos colhidos, a comunidade se mobilizou rapidamente para ajudar quem precisava, enquanto os órgãos responsáveis faziam o levantamento completo e organizavam os próximos passos para os próximos dias.",
  "A reportagem ouviu especialistas, lideranças locais e famílias diretamente envolvidas para entender o que aconteceu, o que muda daqui para frente e quais são as dúvidas que ainda precisam de resposta.",
  "Nos próximos dias, novas informações devem ser divulgadas, e o jornal segue acompanhando o caso com atenção para trazer os desdobramentos em primeira mão aos leitores da região.",
]

function CensoredText({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        articleProseClass,
        "pointer-events-none select-none text-foreground/80 blur-[10px] sm:text-[1.1875rem] sm:leading-[1.75]",
        "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]",
        className
      )}
    >
      {FILLER.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  )
}

/** Aviso "exclusivo para assinantes", com os botões para assinar ou entrar. */
export function PaywallCard({ partial }: { partial: boolean }) {
  const { user } = useAuth()
  const router = useRouter()
  return (
    <div className="w-full max-w-xl rounded-xl bg-contraste p-6 text-center text-contraste-foreground shadow-2xl ring-1 ring-white/10 sm:p-10 dark:bg-[oklch(0.2_0_0)]">
      <LockIcon className="mx-auto size-7 text-[color:var(--amarelo)]" aria-hidden />
      <p className="type-overline mt-3 text-[color:var(--amarelo)]">
        {partial ? "Fim da prévia" : "Exclusivo para assinantes"}
      </p>
      <h2 className="type-h3 mx-auto mt-2 max-w-md text-balance">
        {partial ? "Continue lendo esta reportagem" : "Esta reportagem é só para assinantes"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-contraste-foreground/80">
        Assine o jornal para ler tudo, sem limites, e apoiar o jornalismo feito aqui.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild className="bg-[color:var(--amarelo)] text-black hover:bg-[color:var(--amarelo)]/90">
          <Link href="/minha-conta?aba=assinatura">Quero assinar</Link>
        </Button>
        {!user && (
          <Button
            asChild
            variant="outline"
            className="border-contraste-foreground/30 bg-transparent text-contraste-foreground hover:bg-white/10"
          >
            <Link
              href="/login"
              onClick={(event) => {
                // Depois de entrar, volta para esta notícia.
                event.preventDefault()
                router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)
              }}
            >
              Já sou assinante — entrar
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Texto fechado. Com prévia (notícia parcialmente aberta), as primeiras
 * linhas ficam legíveis e vão se borrando até a parte censurada; sem prévia
 * (só para assinantes), o texto inteiro aparece borrado.
 */
export function LockedArticleBody({ preview }: { preview?: ReactNode }) {
  return (
    <div className="relative mx-auto max-w-5xl">
      {preview}
      <div className="relative min-h-[30rem]">
        {preview ? <ProgressiveBlur className="absolute inset-x-0 -top-32 h-40" /> : null}
        <CensoredText className={preview ? "pt-2" : undefined} />
        <div className="absolute inset-x-0 top-24 flex justify-center px-1 sm:top-28">
          <PaywallCard partial={Boolean(preview)} />
        </div>
      </div>
    </div>
  )
}

/** Selo "exclusivo" no meio de uma área borrada (capa e cartões). */
export function ExclusiveSeal({ partial = false, className }: { partial?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-contraste px-4 py-2 text-sm font-medium text-contraste-foreground shadow-lg ring-1 ring-white/10 dark:bg-[oklch(0.2_0_0)]",
        className
      )}
    >
      <LockIcon className="size-4 text-[color:var(--amarelo)]" aria-hidden />
      {partial ? "Prévia · leia o começo grátis" : "Exclusivo para assinantes"}
    </span>
  )
}
