import type { Variants } from "motion/react"

/**
 * Tokens de movimento para Motion e GSAP.
 * Espelham --duration-* e --easing-* definidos em styles/tokens.css.
 */
export const motionTokens = {
  duration: { fast: 0.12, base: 0.22, slow: 0.48, reveal: 0.7 },
  ease: {
    standard: [0.2, 0, 0, 1],
    emphasized: [0.16, 1, 0.3, 1],
  },
  /** Intervalo entre itens em entradas escalonadas. */
  stagger: 0.07,
} as const satisfies {
  duration: Record<string, number>
  ease: Record<string, readonly [number, number, number, number]>
  stagger: number
}

/** Entrada padrão: sobe levemente enquanto aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.reveal,
      ease: motionTokens.ease.emphasized,
    },
  },
}

/** Contêiner que revela os filhos em sequência. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionTokens.stagger,
      delayChildren: 0.04,
    },
  },
}
