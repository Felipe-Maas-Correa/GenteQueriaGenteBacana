"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Valor de rascunho para campos que gravam na URL com atraso (debounce).
 *
 * O campo responde na hora à digitação, a URL só é atualizada após `delay`, e
 * mudanças externas na URL (voltar do navegador, "limpar filtros") substituem
 * o rascunho — sem atropelar o que a pessoa ainda está digitando.
 */
export function useDraftValue(
  urlValue: string,
  commit: (value: string) => void,
  delay = 350
): [string, (value: string) => void] {
  const [draft, setDraft] = useState(urlValue)
  const [lastUrl, setLastUrl] = useState(urlValue)
  const [lastCommitted, setLastCommitted] = useState(urlValue)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (urlValue !== lastUrl) {
    setLastUrl(urlValue)
    if (urlValue !== lastCommitted) {
      setLastCommitted(urlValue)
      setDraft(urlValue)
    }
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const change = (value: string) => {
    setDraft(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setLastCommitted(value)
      commit(value)
    }, delay)
  }

  return [draft, change]
}
