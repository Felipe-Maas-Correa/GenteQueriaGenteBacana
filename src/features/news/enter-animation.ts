/**
 * Animação de "entrar na notícia": a foto do cartão cresce até cobrir a
 * tela enquanto o fundo escurece; a página da notícia abre por baixo e a
 * camada some suavemente. Sem foto, o próprio cartão cresce.
 */
const DURATION = 420
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"

export function zoomIntoArticle(card: HTMLElement, navigate: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    navigate()
    return
  }

  const source = card.querySelector<HTMLElement>("[data-card-image]") ?? card
  const rect = source.getBoundingClientRect()

  const layer = document.createElement("div")
  layer.setAttribute("aria-hidden", "true")
  Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "100", pointerEvents: "none" })

  const backdrop = document.createElement("div")
  Object.assign(backdrop.style, { position: "absolute", inset: "0", background: "var(--background)", opacity: "0" })

  const clone = source.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: "absolute",
    margin: "0",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    overflow: "hidden",
    aspectRatio: "auto",
  })

  layer.append(backdrop, clone)
  document.body.append(layer)

  backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION, easing: EASE, fill: "forwards" })
  clone.animate(
    [
      { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: "4px", opacity: 1 },
      { left: "0px", top: "0px", width: "100vw", height: "100vh", borderRadius: "0px", opacity: 0.35 },
    ],
    { duration: DURATION, easing: EASE, fill: "forwards" }
  )

  // Timers (e não o fim da animação): funcionam mesmo com a aba em segundo plano.
  window.setTimeout(() => {
    navigate()
    // Dá tempo da página nova montar e então revela.
    window.setTimeout(() => {
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: "ease-out", fill: "forwards" })
      window.setTimeout(() => layer.remove(), 400)
    }, 150)
  }, DURATION)
}
