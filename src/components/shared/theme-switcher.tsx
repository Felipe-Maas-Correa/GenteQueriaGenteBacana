"use client"

import { useSyncExternalStore } from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const options = [
  { value: "system", label: "Do navegador", icon: MonitorIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
] as const

const subscribe = () => () => {}

/**
 * Seletor de tema. O padrão segue o navegador/sistema; a escolha fica salva
 * neste navegador e vale para o site e para o painel.
 */
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
      className="inline-flex flex-wrap rounded-lg border bg-muted p-1"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const selected = mounted && (theme ?? "system") === value
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
