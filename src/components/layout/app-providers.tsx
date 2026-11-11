"use client"

import { MotionConfig } from "motion/react"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/authentication/auth-context"
import { EditoriasProvider } from "@/features/editorias/editorias-context"
import { motionTokens } from "@/lib/design-system/motion"

/** Provedores globais: tema, movimento, autenticação Firebase, tooltips e toasts. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: motionTokens.duration.base,
          ease: motionTokens.ease.emphasized,
        }}
      >
        <AuthProvider>
          <EditoriasProvider>
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </EditoriasProvider>
          <Toaster position="bottom-right" richColors={false} closeButton />
        </AuthProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
