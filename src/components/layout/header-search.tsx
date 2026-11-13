"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Pesquisa de notícias no cabeçalho. Em /noticias filtra na hora; em outras
 * páginas, Enter abre /noticias já filtrada. O termo vai pela sessionStorage
 * (o endereço fica limpo, como o dono prefere).
 */
export const SEARCH_EVENT = "gqgb:pesquisa"
const PENDING_KEY = "gqgb:pesquisa-pendente"

export function takePendingSearch(): string {
  try {
    const value = sessionStorage.getItem(PENDING_KEY) ?? ""
    sessionStorage.removeItem(PENDING_KEY)
    return value
  } catch {
    return ""
  }
}

export function emitSearch(value: string) {
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: value }))
}

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const onNews = pathname === "/noticias"

  // A página pode limpar a pesquisa (botão "x" nos resultados).
  useEffect(() => {
    const sync = (event: Event) => setValue((event as CustomEvent<string>).detail)
    window.addEventListener(SEARCH_EVENT, sync)
    return () => window.removeEventListener(SEARCH_EVENT, sync)
  }, [])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  const change = (next: string) => {
    setValue(next)
    if (onNews) emitSearch(next)
  }

  const submit = () => {
    const term = value.trim()
    if (onNews) {
      emitSearch(term)
      return
    }
    if (!term) return
    try {
      sessionStorage.setItem(PENDING_KEY, term)
    } catch {
      // sem armazenamento: abre a lista completa
    }
    setOpen(false)
    router.push("/noticias")
  }

  return (
    <div className={cn("flex items-center", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
        className={cn(
          "relative items-center",
          open ? "absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 md:static md:inset-auto md:translate-y-0" : "hidden lg:flex"
        )}
      >
        <SearchIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <input
          ref={input}
          type="search"
          value={value}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              change("")
              setOpen(false)
            }
          }}
          placeholder="Pesquisar notícias"
          aria-label="Pesquisar notícias"
          className="h-9 w-full rounded-full border bg-muted/60 pr-9 pl-9 text-sm outline-none transition-[width,background-color] focus:bg-background focus:ring-3 focus:ring-ring/40 lg:w-52 lg:focus:w-64 [&::-webkit-search-cancel-button]:hidden"
        />
        {value || open ? (
          <button
            type="button"
            aria-label="Fechar pesquisa"
            onClick={() => {
              change("")
              setOpen(false)
            }}
            className="absolute right-1.5 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </form>
      {!open ? (
        <button
          type="button"
          aria-label="Pesquisar notícias"
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-full text-foreground/80 hover:bg-muted lg:hidden"
        >
          <SearchIcon className="size-5" />
        </button>
      ) : null}
    </div>
  )
}
