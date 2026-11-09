import Link from "next/link"

import { LogoMark } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-6 py-24 text-center">
      <div className="max-w-md space-y-5">
        <LogoMark className="mx-auto h-10" />
        <p className="type-overline text-brand">Erro 404</p>
        <h1 className="type-h1">Esta página não existe</h1>
        <p className="type-body text-muted-foreground">
          O endereço pode ter mudado ou o conteúdo foi removido.
        </p>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  )
}
