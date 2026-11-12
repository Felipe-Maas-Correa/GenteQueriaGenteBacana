"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

/**
 * Leva até a seção de uma editoria na página /noticias SEM usar "#" no
 * endereço (o dono prefere a barra limpa). O destino vai pela sessionStorage
 * e a página rola até ele depois que as notícias carregam.
 */
const PENDING_KEY = "gqgb:editoria-alvo"

type LenisLike = { scrollTo: (target: Element, options?: { offset?: number }) => void }

/** Rola suavemente até a seção, descontando o cabeçalho fixo. */
export function scrollToSection(id: string): boolean {
  const element = document.getElementById(id)
  if (!element) return false
  const header = document.querySelector("header")?.getBoundingClientRect().height ?? 64
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis
  if (lenis) lenis.scrollTo(element, { offset: -header - 16 })
  else window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - header - 16, behavior: "smooth" })
  return true
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
}: {
  slug: string
  className?: string
  onNavigate?: () => void
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Link
      href="/noticias"
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        onNavigate?.()
        if (pathname === "/noticias" && scrollToSection(slug)) return
        try {
          sessionStorage.setItem(PENDING_KEY, slug)
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
