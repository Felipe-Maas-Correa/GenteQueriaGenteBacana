"use client"

import Link from "next/link"
import { useState } from "react"
import { MenuIcon, UserIcon } from "lucide-react"
import { motion, useMotionValueEvent, useScroll } from "motion/react"

import { UserMenu } from "@/components/layout/user-menu"
import { Logo } from "@/components/shared/logo"
import { useAuth } from "@/features/authentication/auth-context"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { EditoriaLink } from "@/components/layout/editoria-link"
import { HeaderSearch } from "@/components/layout/header-search"
import { useEditorias } from "@/features/editorias/editorias-context"
import { cn } from "@/lib/utils"

const navLinkClass =
  "relative rounded-sm py-1 text-sm font-medium text-foreground/75 outline-none transition-colors duration-(--duration-fast) hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-(--duration-base) after:ease-emphasized hover:after:scale-x-100 aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100"

/** Canto superior direito: menu do usuário conectado, ou Entrar / Criar conta. */
function HeaderAccount() {
  const { status } = useAuth()

  if (status === "authenticated") return <UserMenu />
  if (status === "loading") {
    return <span className="size-9 animate-pulse rounded-full bg-muted" aria-hidden />
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <UserIcon aria-hidden />
          Entrar
        </Link>
      </Button>
      <Button asChild size="sm" className="hidden sm:inline-flex">
        <Link href="/login?modo=cadastro">Criar conta</Link>
      </Button>
    </div>
  )
}

/** Cabeçalho do portal: fica fixo e ganha fundo ao rolar a página. */
export function SiteHeader() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { menu } = useEditorias()

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 24)
  })

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-(--duration-base)",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-md"
          : "border-transparent bg-background"
      )}
    >
      <div className="page-container relative flex h-(--topbar-h) items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="Gente Querida, Gente Bacana — página inicial"
          className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Logo size="sm" />
        </Link>

        <nav aria-label="Editorias" className="hidden items-center gap-7 md:flex">
          {menu.map((editoria) => (
            <EditoriaLink key={editoria.id} slug={editoria.slug} className={navLinkClass}>
              {editoria.name}
            </EditoriaLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderSearch />
          <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex">
            <EditoriaLink slug="">Todas as notícias</EditoriaLink>
          </Button>
          <HeaderAccount />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menu"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-[85vw] p-6">
              <SheetTitle className="type-overline text-muted-foreground">
                Editorias
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navegação pelas editorias do portal.
              </SheetDescription>
              <nav aria-label="Editorias" className="mt-2 grid">
                {[{ id: "todas", slug: "", name: "Todas as notícias" }, ...menu].map(
                  (editoria, index) => (
                    <motion.div
                      key={editoria.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index + 0.1 }}
                    >
                      <EditoriaLink
                        slug={editoria.slug}
                        onNavigate={() => setMenuOpen(false)}
                        className="type-h2 block rounded-sm border-b py-3 outline-none transition-colors hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/40 aria-[current=page]:text-brand"
                      >
                        {editoria.name}
                      </EditoriaLink>
                    </motion.div>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Celular: editorias numa faixa que rola para os lados. */}
      {menu.length ? (
        <nav
          aria-label="Editorias"
          className="relative border-t md:hidden after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-background after:to-transparent"
        >
          <div className="flex snap-x scroll-px-4 gap-6 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menu.map((editoria) => (
              <EditoriaLink
                key={editoria.id}
                slug={editoria.slug}
                className={cn(navLinkClass, "shrink-0 snap-start whitespace-nowrap")}
              >
                {editoria.name}
              </EditoriaLink>
            ))}
            <EditoriaLink slug="" className={cn(navLinkClass, "shrink-0 whitespace-nowrap pr-6")}>
              Todas
            </EditoriaLink>
          </div>
        </nav>
      ) : null}
    </motion.header>
  )
}
