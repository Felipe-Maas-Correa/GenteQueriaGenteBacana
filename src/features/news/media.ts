/**
 * Mídia dentro do texto das notícias: tamanhos de foto, carrossel e vídeo.
 *
 * Formato salvo no HTML do editor (e só ele é aceito na leitura):
 *   <img src="…" data-size="small|medium|large|full">
 *   <div data-type="gallery" data-images='["/api/imagens/a", …]'></div>
 *   <div data-type="video" data-src="https://www.youtube.com/watch?v=…"></div>
 *
 * Na leitura, o HTML passa pelo DOMPurify e depois os blocos são montados
 * AQUI, a partir de dados validados: o <iframe> do vídeo nunca vem do texto
 * salvo — o endereço é reconstruído a partir do ID do YouTube/Vimeo.
 */

export const IMAGE_SIZES = ["small", "medium", "large", "full"] as const
export type ImageSize = (typeof IMAGE_SIZES)[number]

export const imageSizeLabels: Record<ImageSize, string> = {
  small: "Pequena",
  medium: "Média",
  large: "Grande",
  full: "Inteira",
}

export function isAllowedImageSrc(src: string): boolean {
  return /^\/api\/imagens\/[A-Za-z0-9]{1,64}$/.test(src) || /^https:\/\/[^\s"'<>]+$/.test(src)
}

/* ── Vídeo ───────────────────────────────────────────────────── */

export type VideoInfo =
  | { provider: "youtube"; id: string; embed: string; thumbnail: string }
  | { provider: "vimeo"; id: string; embed: string; thumbnail: null }
  | { provider: "file"; id: string; embed: string; thumbnail: null }

/**
 * Entende links do YouTube (watch, youtu.be, shorts, embed), do Vimeo e de
 * arquivos .mp4/.webm. Os vídeos começam SEM SOM (mute) e usam o player do
 * próprio serviço, que já tem qualidade, velocidade, volume e tela cheia.
 */
export function parseVideo(input: string): VideoInfo | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== "https:") return null
  const host = url.hostname.replace(/^www\.|^m\./, "")

  let youtubeId: string | null = null
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    youtubeId =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ??
      null
  } else if (host === "youtu.be") {
    youtubeId = url.pathname.slice(1).split("/")[0] || null
  }
  if (youtubeId && /^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return {
      provider: "youtube",
      id: youtubeId,
      embed: `https://www.youtube-nocookie.com/embed/${youtubeId}?mute=1&playsinline=1&rel=0&modestbranding=1`,
      thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.match(/(\d{6,12})/)?.[1]
    if (id) {
      return {
        provider: "vimeo",
        id,
        embed: `https://player.vimeo.com/video/${id}?muted=1&playsinline=1&dnt=1`,
        thumbnail: null,
      }
    }
  }

  if (/\.(mp4|webm)$/i.test(url.pathname)) {
    return { provider: "file", id: url.href, embed: url.href, thumbnail: null }
  }
  return null
}

/* ── HTML dos blocos (leitura) ───────────────────────────────── */

const escapeAttr = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export function readGallery(value: string | null | undefined): string[] {
  try {
    const list = JSON.parse(value ?? "[]")
    return Array.isArray(list) ? list.filter((src) => typeof src === "string" && isAllowedImageSrc(src)).slice(0, 30) : []
  } catch {
    return []
  }
}

function galleryHtml(images: string[]): string {
  if (!images.length) return ""
  const slides = images
    .map(
      (src, index) =>
        `<div class="w-full shrink-0 snap-center"><img src="${escapeAttr(src)}" alt="Foto ${index + 1} de ${images.length}" loading="lazy" class="!my-0 aspect-[3/2] w-full rounded-none object-cover"></div>`
    )
    .join("")
  const nav =
    images.length > 1
      ? `<button type="button" data-carousel-prev aria-label="Foto anterior" class="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-xl text-white backdrop-blur-sm transition hover:bg-black/75">‹</button>` +
        `<button type="button" data-carousel-next aria-label="Próxima foto" class="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-xl text-white backdrop-blur-sm transition hover:bg-black/75">›</button>` +
        `<span data-carousel-count class="absolute right-3 bottom-3 rounded-full bg-black/60 px-2.5 py-1 font-sans text-xs text-white">1 / ${images.length}</span>`
      : ""
  return `<figure data-carousel class="relative my-8 overflow-hidden rounded-sm bg-muted"><div data-carousel-track class="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">${slides}</div>${nav}</figure>`
}

function videoHtml(info: VideoInfo): string {
  if (info.provider === "file") {
    return `<figure class="my-8"><video src="${escapeAttr(info.embed)}" controls muted playsinline preload="metadata" class="aspect-video w-full rounded-sm bg-black"></video></figure>`
  }
  return `<figure class="my-8"><div class="relative aspect-video overflow-hidden rounded-sm bg-black"><iframe src="${escapeAttr(info.embed)}" title="Vídeo" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" class="absolute inset-0 size-full border-0"></iframe></div></figure>`
}

/**
 * Troca os blocos de carrossel e vídeo (já sanitizados) pelo HTML final.
 * Roda no navegador, depois do DOMPurify.
 */
export function expandMediaBlocks(html: string): string {
  if (typeof DOMParser === "undefined" || !/data-type="(gallery|video)"/.test(html)) return html
  const root = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild
  if (!root) return html
  root.querySelectorAll('div[data-type="gallery"]').forEach((node) => {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = galleryHtml(readGallery(node.getAttribute("data-images")))
    node.replaceWith(...Array.from(wrapper.childNodes))
  })
  root.querySelectorAll('div[data-type="video"]').forEach((node) => {
    const info = parseVideo(node.getAttribute("data-src") ?? "")
    const wrapper = document.createElement("div")
    wrapper.innerHTML = info ? videoHtml(info) : ""
    node.replaceWith(...Array.from(wrapper.childNodes))
  })
  return root.innerHTML
}

/** Liga as setas e o contador dos carrosséis montados por expandMediaBlocks. */
export function wireCarousels(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = []
  container.querySelectorAll<HTMLElement>("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>("[data-carousel-track]")
    if (!track) return
    const count = carousel.querySelector<HTMLElement>("[data-carousel-count]")
    const total = track.children.length
    const go = (delta: number) => track.scrollBy({ left: delta * track.clientWidth, behavior: "smooth" })
    const prev = () => go(-1)
    const next = () => go(1)
    const update = () => {
      if (count) count.textContent = `${Math.round(track.scrollLeft / track.clientWidth) + 1} / ${total}`
    }
    const prevButton = carousel.querySelector("[data-carousel-prev]")
    const nextButton = carousel.querySelector("[data-carousel-next]")
    prevButton?.addEventListener("click", prev)
    nextButton?.addEventListener("click", next)
    track.addEventListener("scroll", update, { passive: true })
    cleanups.push(() => {
      prevButton?.removeEventListener("click", prev)
      nextButton?.removeEventListener("click", next)
      track.removeEventListener("scroll", update)
    })
  })
  return () => cleanups.forEach((cleanup) => cleanup())
}
