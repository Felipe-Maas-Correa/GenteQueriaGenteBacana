"use client"

import { useId, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { controlBase, controlSizing } from "@/lib/design-system/control"
import { cn } from "@/lib/utils"

export type ComboboxOption = { value: string; label: string }

type ComboboxProps = {
  options: ComboboxOption[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  /** Permite desmarcar a opção selecionada clicando nela novamente. */
  clearable?: boolean
  disabled?: boolean
  className?: string
  id?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

/** Select com busca — indicado para listas longas (ex.: áreas). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecione…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Nenhum resultado.",
  clearable = false,
  disabled,
  className,
  ...aria
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          className={cn(
            controlBase,
            controlSizing,
            "flex items-center justify-between gap-2 text-left",
            !selected && "text-muted-foreground/80",
            className
          )}
          {...aria}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-0"
      >
        <Command
          filter={(itemValue, search, keywords) => {
            const haystack = normalize(`${itemValue} ${keywords?.join(" ") ?? ""}`)
            return haystack.includes(normalize(search)) ? 1 : 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList id={listId}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => {
                    const isSelected = option.value === value
                    onChange(isSelected && clearable ? undefined : option.value)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}
