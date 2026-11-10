import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { Logo, LogoMark } from "@/components/shared/logo"
import { Reveal } from "@/components/shared/reveal"
import { SetupNotice } from "@/components/shared/setup-notice"
import { Skeleton } from "@/components/ui/skeleton"
import { LoginForm } from "@/features/authentication/components/login-form"
import { isFirebaseConfigured } from "@/lib/firebase/config"

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  const configured = isFirebaseConfigured()

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <LogoMark className="pointer-events-none absolute -right-24 -bottom-20 h-[28rem] opacity-[0.07]" />
        <Logo size="md" />
        <Reveal className="relative max-w-lg space-y-5">
          <p className="type-overline text-sidebar-primary">Painel da redação</p>
          <p className="type-h1 text-sidebar-foreground">
            Quem faz o jornal chegar em cada casa{" "}
            <em className="font-normal text-sidebar-primary">começa por aqui.</em>
          </p>
          <p className="type-body text-sidebar-muted-foreground">
            Assinantes, áreas de entrega e etiquetas — organizados em um só
            lugar.
          </p>
        </Reveal>
        <p className="type-caption relative font-normal text-sidebar-muted-foreground">
          Acesso restrito à equipe do jornal.
        </p>
      </aside>

      <main className="flex flex-col px-6 py-8 sm:px-10">
        <Link
          href="/"
          className="type-small inline-flex w-fit items-center gap-1.5 rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <ArrowLeftIcon className="size-4" aria-hidden />
          Voltar ao portal
        </Link>

        <Reveal className="m-auto w-full max-w-sm space-y-8 py-10">
          <Logo size="md" className="lg:hidden" />
          <div className="space-y-2">
            <h1 className="type-h2">Entrar no painel</h1>
            <p className="type-small text-muted-foreground">
              Use o e-mail e a senha fornecidos pela administração do jornal.
            </p>
          </div>

          {configured ? null : <SetupNotice />}

          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoginForm disabled={!configured} />
          </Suspense>

          <p className="type-caption font-normal text-muted-foreground">
            Não há cadastro público. Novos acessos são criados pela
            administração.
          </p>
        </Reveal>
      </main>
    </div>
  )
}
