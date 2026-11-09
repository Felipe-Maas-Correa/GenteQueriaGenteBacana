"use client"

import { animate, useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef } from "react"

import { motionTokens } from "@/lib/design-system/motion"
import { formatNumber } from "@/lib/utils/format"

/**
 * Número que conta até o valor final quando entra na tela.
 * O valor real já vem renderizado do servidor; a animação é só um realce.
 */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !inView || reduceMotion || value === 0) return

    const controls = animate(0, value, {
      duration: 0.9,
      ease: motionTokens.ease.emphasized,
      onUpdate: (latest) => {
        node.textContent = formatNumber(Math.round(latest))
      },
    })
    return () => {
      controls.stop()
      node.textContent = formatNumber(value)
    }
  }, [inView, reduceMotion, value])

  return <span ref={ref}>{formatNumber(value)}</span>
}
