import { InfoIcon } from "lucide-react"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SmoothScroll } from "@/components/layout/smooth-scroll"

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SmoothScroll />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      {/* Aviso temporário: sai junto com o conteúdo ilustrativo (features/news/demo-articles.ts). */}
      <p className="type-caption flex items-center justify-center gap-2 bg-brand-soft px-4 py-2 text-center text-foreground">
        <InfoIcon className="size-3.5 shrink-0 text-brand" aria-hidden />
        Portal em construção — as matérias exibidas são exemplos ilustrativos.
      </p>
      <SiteHeader />
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
