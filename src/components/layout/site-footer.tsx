import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { FooterEditorias } from "@/components/layout/footer-editorias"
import { siteConfig } from "@/lib/site"

const linkClass =
  "rounded-sm text-sm text-contraste-muted-foreground outline-none transition-colors hover:text-contraste-foreground focus-visible:ring-3 focus-visible:ring-contraste-ring/50"

/**
 * Rodapé do portal. Endereço, contato e redes sociais serão incluídos quando
 * forem informados pelos responsáveis pelo jornal.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-contraste text-contraste-foreground">
      <div className="page-container grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo size="md" />
          <p className="type-small max-w-sm text-contraste-muted-foreground">
            {siteConfig.description}
          </p>
        </div>

        <nav aria-label="Editorias no rodapé" className="space-y-3">
          <p className="type-overline text-contraste-muted-foreground/70">
            Editorias
          </p>
          <FooterEditorias linkClass={linkClass} />
        </nav>

        <nav aria-label="Institucional" className="space-y-3">
          <p className="type-overline text-contraste-muted-foreground/70">
            O jornal
          </p>
          <ul className="grid gap-2">
            <li>
              <Link href="/noticias" className={linkClass}>
                Todas as notícias
              </Link>
            </li>
            <li>
              <Link href="/login" className={linkClass}>
                Área restrita
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-contraste-border">
        <p className="page-container type-caption py-5 font-normal text-contraste-muted-foreground">
          {siteConfig.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
