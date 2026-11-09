"use client"

import { motion } from "motion/react"

import { fadeUp, staggerContainer } from "@/lib/design-system/motion"

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Atraso em segundos antes da entrada. */
  delay?: number
  as?: "div" | "section" | "li" | "article" | "header"
}

const viewport = { once: true, margin: "0px 0px -10% 0px" } as const

/** Revela o conteúdo quando ele entra na área visível. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ delay }}
    >
      {children}
    </Component>
  )
}

/** Grupo cujos <RevealItem> aparecem em sequência. */
export function RevealGroup({
  children,
  className,
  as = "div",
}: Omit<RevealProps, "delay"> & { as?: "div" | "section" | "ul" | "ol" }) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </Component>
  )
}

export function RevealItem({
  children,
  className,
  as = "div",
}: Omit<RevealProps, "delay">) {
  const Component = motion[as]
  return (
    <Component className={className} variants={fadeUp}>
      {children}
    </Component>
  )
}
