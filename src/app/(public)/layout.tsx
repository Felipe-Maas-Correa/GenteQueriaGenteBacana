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
      <SiteHeader />
      <main id="conteudo" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
