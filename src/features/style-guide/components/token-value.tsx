"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

const subscribe = () => () => {}

/** Lê, no navegador, o valor atual de uma variável CSS do Design System. */
export function TokenValue({ variable }: { variable: string }) {
  // Releitura quando o tema muda (os valores do modo escuro são diferentes).
  const { resolvedTheme } = useTheme()
  const value = useSyncExternalStore(
    subscribe,
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim() || "—",
    () => "…"
  )

  return (
    <code className="type-data text-[0.75rem] break-all" data-theme={resolvedTheme}>
      {value}
    </code>
  )
}
