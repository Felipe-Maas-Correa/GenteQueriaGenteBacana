"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"

/**
 * Abre /noticias filtrada pela editoria SEM mudar o endereço (o dono prefere
 * a barra limpa). O filtro vai pela sessionStorage (ou por evento, se a
 * página já estiver aberta). slug vazio = todas as notícias.
 */
const PENDING_KEY = "gqgb:editoria-alvo"

/** Evento disparado ao clicar numa editoria estando já em /noticias. */
export const EDITORIA_EVENT = "gqgb:editoria"

type LenisLike = { scrollTo: (target: Element | number, options?: { offset?: number }) => void }

function getLenis(): LenisLike | undefined {
  return (window as unknown as { __lenis?: LenisLike }).__lenis
}

/** Rola suavemente até a seção, descontando o cabeçalho fixo. */
export function scrollToSection(id: string): boolean {
  const element = document.getElementById(id)
  if (!element) return false
  const header = document.querySelector("header")?.getBoundingClientRect().height ?? 64
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(element, { offset: -header - 16 })
  else window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - header - 16, behavior: "smooth" })
  return true
}

/** Volta suavemente para o topo da página. */
export function scrollToTop() {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(0)
  else window.scrollTo({ top: 0, behavior: "smooth" })
}

/* Editoria aberta agora em /noticias, para o menu marcar o link certo. */
let activeSlug: string | null = null
const listeners = new Set<() => void>()

/** Usado pela página /noticias para avisar qual editoria está aberta. */
export function setActiveEditoria(slug: string | null) {
  if (activeSlug === slug) return
  activeSlug = slug
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function useActiveEditoria() {
  return useSyncExternalStore(
    subscribe,
    () => activeSlug,
    () => null
  )
}

/** Lê (e apaga) a editoria pendente; usado pela página /noticias. */
export function takePendingEditoria(): string | null {
  try {
    const slug = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return slug
  } catch {
    return null
  }
}

export function EditoriaLink({
  slug,
  className,
  onNavigate,
  children,
  ...props
}: Omit<React.ComponentProps<"a">, "href" | "onClick"> & {
  /** Slug da editoria; vazio abre todas as notícias. */
  slug: string
  onNavigate?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const openSlug = useActiveEditoria()
  const active = pathname === "/noticias" && (openSlug ?? "") === slug

  return (
    <Link
      {...props}
      href="/noticias"
      className={className}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        onNavigate?.()
        if (pathname === "/noticias") {
          // Já na página: ela troca o filtro na hora.
          window.dispatchEvent(new CustomEvent(EDITORIA_EVENT, { detail: slug }))
          return
        }
        try {
          if (slug) sessionStorage.setItem(PENDING_KEY, slug)
          else sessionStorage.removeItem(PENDING_KEY)
        } catch {
          // Sem armazenamento: abre a página no topo.
        }
        router.push("/noticias")
      }}
    >
      {children}
    </Link>
  )
}
