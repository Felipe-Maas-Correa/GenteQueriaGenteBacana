"use client"

import { doc, getDoc } from "firebase/firestore"
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
  const promise = getDoc(doc(getDb(), "imagens", id)).then((snapshot) => {
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
}: {
  src: string
  alt?: string
  className?: string
  loading?: "lazy" | "eager"
}) {
  const { data } = useAsync(() => resolveImageSrc(src), [src])

  if (!data) {
    return <span aria-hidden className={cn("block animate-pulse bg-muted", className)} />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={data} alt={alt} loading={loading} className={className} />
}
