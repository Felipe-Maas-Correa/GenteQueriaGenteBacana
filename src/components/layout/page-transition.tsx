"use client"

import { motion } from "motion/react"

/** Entrada suave aplicada a cada troca de página (usada nos arquivos template.tsx). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      // Na impressão, a animação não pode esconder nem deslocar o conteúdo.
      className="flex flex-1 flex-col print:block print:transform-none! print:opacity-100!"
    >
      {children}
    </motion.div>
  )
}
