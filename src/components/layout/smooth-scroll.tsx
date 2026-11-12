"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

/**
 * Rolagem suave do portal público (Lenis), sincronizada com o ScrollTrigger
 * do GSAP. Não é ativada para quem prefere movimento reduzido.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ lerp: 0.12, anchors: true })
    lenis.on("scroll", ScrollTrigger.update)
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      delete (window as unknown as { __lenis?: Lenis }).__lenis
    }
  }, [])

  return null
}
