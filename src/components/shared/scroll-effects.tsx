"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { cn } from "@/lib/utils"

const MOTION_OK = "(prefers-reduced-motion: no-preference)"

/**
 * Parallax vinculado à rolagem (GSAP ScrollTrigger): o conteúdo se desloca
 * mais devagar que a página. `amount` é o deslocamento total em % da altura.
 */
export function Parallax({
  children,
  className,
  amount = 12,
}: {
  children: React.ReactNode
  className?: string
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    gsap.registerPlugin(ScrollTrigger)

    const media = gsap.matchMedia()
    media.add(MOTION_OK, () => {
      gsap.fromTo(
        node.firstElementChild,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: node,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      )
    })
    return () => media.revert()
  }, [amount])

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div className="size-full scale-[1.15]">{children}</div>
    </div>
  )
}

/**
 * Faixa de texto que desliza na horizontal conforme a rolagem (GSAP).
 * Decorativa: o conteúdo é repetido e fica oculto para leitores de tela.
 */
export function ScrollMarquee({
  items,
  className,
}: {
  items: readonly string[]
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    gsap.registerPlugin(ScrollTrigger)

    const media = gsap.matchMedia()
    media.add(MOTION_OK, () => {
      gsap.fromTo(
        node.firstElementChild,
        { xPercent: 0 },
        {
          xPercent: -28,
          ease: "none",
          scrollTrigger: {
            trigger: node,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      )
    })
    return () => media.revert()
  }, [])

  const repeated = [...items, ...items, ...items]

  return (
    <div ref={ref} aria-hidden className={cn("overflow-hidden", className)}>
      <div className="flex w-max items-center gap-8 whitespace-nowrap will-change-transform">
        {repeated.map((item, index) => (
          <span key={index} className="flex items-center gap-8">
            <span
              className={cn(
                "font-display text-[clamp(3rem,9vw,7.5rem)] leading-none tracking-[-0.03em]",
                index % 2 === 0 ? "font-medium" : "font-light italic text-brand"
              )}
            >
              {item}
            </span>
            <span className="size-3 rounded-full bg-brand" />
          </span>
        ))}
      </div>
    </div>
  )
}
