"use client"

import { SearchIcon, XIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SearchInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string
  onChange: (value: string) => void
}

/** Campo de pesquisa com ícone e botão para limpar. */
export function SearchInput({
  value,
  onChange,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="px-9 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <XIcon className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
