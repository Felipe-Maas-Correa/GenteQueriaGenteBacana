"use client"

import { useSyncExternalStore } from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
  { value: "system", label: "Sistema", icon: MonitorIcon },
] as const

const subscribe = () => () => {}

/**
 * Botão compacto do cabeçalho do site: alterna entre claro e escuro
 * (a partir do tema que está de fato na tela, mesmo quando é o do sistema).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const dark = mounted && resolvedTheme === "dark"
  const label = dark ? "Usar tema claro" : "Usar tema escuro"

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-(--control-h-sm) place-items-center rounded-md text-foreground/75 outline-none transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40",
        className
      )}
    >
      {dark ? (
        <SunIcon className="size-4" aria-hidden />
      ) : (
        <MoonIcon className="size-4" aria-hidden />
      )}
    </button>
  )
}

/** Seletor de tema (claro, escuro ou o do sistema). A escolha fica salva no navegador. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  // O tema só é conhecido no navegador; evita divergência na hidratação.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="inline-flex rounded-lg border bg-muted p-1"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-(--control-h-sm) items-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors duration-(--duration-fast) focus-visible:ring-3 focus-visible:ring-ring/40",
              selected
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
