import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowLeftIcon } from "lucide-react"

import { Logo } from "@/components/shared/logo"
import { Skeleton } from "@/components/ui/skeleton"
import { ResetPasswordForm } from "@/features/authentication/components/reset-password-form"

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false, follow: false },
}

/**
 * Destino do link "Redefinir senha" enviado por e-mail. Configure no Console
 * do Firebase (Authentication › Modelos › Redefinição de senha › Personalizar
 * URL de ação) o endereço https://SEU-DOMINIO/redefinir-senha.
 */
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col px-6 py-8 sm:px-10">
      <Link
        href="/"
        className="type-small inline-flex w-fit items-center gap-1.5 rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Voltar ao portal
      </Link>

      <div className="m-auto w-full max-w-sm space-y-8 py-10">
        <Logo size="md" />
        <div className="space-y-2 border-t pt-6">
          <h1 className="type-h2">Criar nova senha</h1>
          <p className="type-small text-muted-foreground">
            Escolha uma senha nova para entrar no site.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-56 w-full" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
