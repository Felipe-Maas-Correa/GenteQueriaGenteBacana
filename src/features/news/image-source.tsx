"use client"

import { useEffect, useRef, useState } from "react"
import { doc, getDoc, getDocFromCache } from "firebase/firestore"
import { useAsync } from "@/hooks/use-async"
import { getDb, getFirebase } from "@/lib/firebase/client"
import { cn } from "@/lib/utils"

/**
 * Fotos enviadas pelo painel ficam em base64 na coleção `imagens` do
 * Firestore e são referenciadas como "/api/imagens/{id}" (formato mantido por
 * compatibilidade com as notícias já salvas). Como o site é estático, o
 * navegador busca a foto no banco e a exibe como data URL. Cada foto é
 * buscada uma única vez por visita (cache em memória).
 */
const PREFIX = "/api/imagens/"
const cache = new Map<string, Promise<string>>()

export function isStoredImage(src: string): boolean {
  return src.startsWith(PREFIX)
}

export function storedImageUrl(id: string): string {
  return `${PREFIX}${id}`
}

/** Converte a referência interna em um endereço que o <img> entende. */
export function resolveImageSrc(src: string): Promise<string> {
  if (!isStoredImage(src) || !getFirebase()) return Promise.resolve(src)
  const cached = cache.get(src)
  if (cached) return cached
  const id = src.slice(PREFIX.length)
  // Fotos nunca mudam depois de enviadas: tenta primeiro o cache local do
  // navegador (IndexedDB) e só vai ao servidor se ainda não tiver a foto.
  const ref = doc(getDb(), "imagens", id)
  const promise = getDocFromCache(ref)
    .then((snapshot) => (snapshot.exists() ? snapshot : getDoc(ref)))
    .catch(() => getDoc(ref))
    .then((snapshot) => {
    const data = snapshot.data()
    if (!data || typeof data.data !== "string") throw new Error("Imagem não encontrada")
    return `data:${(data.content_type as string) || "image/jpeg"};base64,${data.data}`
  })
  // Em caso de falha, permite tentar de novo numa próxima renderização.
  promise.catch(() => cache.delete(src))
  cache.set(src, promise)
  return promise
}

/** Troca as referências internas de <img> dentro de um HTML por data URLs. */
export async function resolveImagesInHtml(html: string): Promise<string> {
  const sources = [...html.matchAll(/src="(\/api\/imagens\/[A-Za-z0-9]+)"/g)].map((m) => m[1])
  if (!sources.length) return html
  const resolved = await Promise.all(sources.map((src) => resolveImageSrc(src).catch(() => "")))
  let result = html
  sources.forEach((src, index) => {
    result = result.split(`src="${src}"`).join(`src="${resolved[index]}"`)
  })
  return result
}

/** <img> que entende fotos guardadas no Firestore. */
export function StoredImage({
  src,
  alt = "",
  className,
  loading = "lazy",
  fallback,
}: {
  src: string
  alt?: string
  className?: string
  loading?: "lazy" | "eager"
  /** Mostrado se a foto não carregar (endereço externo fora do ar, etc.). */
  fallback?: React.ReactNode
}) {
  // Fotos do banco só são baixadas quando chegam perto da tela (as de cima,
  // "eager", na hora). Antes, todas as fotos da página baixavam juntas.
  const holder = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(loading === "eager" || !isStoredImage(src))
  useEffect(() => {
    const element = holder.current
    if (near || !element) return
    const MARGIN = 600
    const isClose = () => {
      const rect = element.getBoundingClientRect()
      return rect.top < window.innerHeight + MARGIN && rect.bottom > -MARGIN
    }
    const reveal = () => {
      setNear(true)
      cleanup()
    }
    const check = () => {
      if (isClose()) reveal()
    }
    const observer = new IntersectionObserver(
      (entries) => entries.some((entry) => entry.isIntersecting) && reveal(),
      { rootMargin: `${MARGIN}px 0px` }
    )
    observer.observe(element)
    // Reforço: o observador pausa em abas em segundo plano; a rolagem e um
    // teste inicial garantem que as fotos da tela carreguem mesmo assim.
    const timer = window.setTimeout(check, 50)
    window.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    function cleanup() {
      observer.disconnect()
      window.clearTimeout(timer)
      window.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
    return cleanup
  }, [near])
  const { data, error } = useAsync(() => (near ? resolveImageSrc(src) : Promise.resolve("")), [src, near])
  const [broken, setBroken] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<string | null>(null)

  // Endereço externo que nunca responde (fica "carregando" para sempre):
  // depois de 10 s, desiste e mostra a alternativa.
  useEffect(() => {
    if (!fallback || !data || loaded === src || broken === src) return
    const timer = window.setTimeout(() => setBroken(src), 10_000)
    return () => window.clearTimeout(timer)
  }, [fallback, data, src, loaded, broken])

  if ((error || broken === src) && fallback) return <>{fallback}</>

  if (!data) {
    return <span ref={holder} aria-hidden className={cn("block animate-pulse bg-muted", className)} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={data} alt={alt} loading={loading} className={className} onError={() => setBroken(src)} onLoad={() => setLoaded(src)} />
}
