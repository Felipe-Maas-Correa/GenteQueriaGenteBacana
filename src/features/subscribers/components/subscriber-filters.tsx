"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { Loader2Icon, SlidersHorizontalIcon, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { Combobox } from "@/components/forms/combobox"
import { SearchInput } from "@/components/forms/search-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AreaOption } from "@/features/areas/queries"
import { useDraftValue } from "@/hooks/use-draft-value"
import { MONTHS } from "@/lib/utils/months"

import {
  countActiveFilters,
  FILTER_PARAM,
  parseSubscriberFilters,
} from "../filters"

const ALL = "all"

type FilterKey = keyof typeof FILTER_PARAM

function FilterField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="type-caption mb-1.5 block text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

/**
 * Pesquisa e filtros da listagem de assinantes. O estado vive na URL: cada
 * alteração atualiza a query string e o servidor refaz a consulta.
 */
export function SubscriberFilters({ areas }: { areas: AreaOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const filters = parseSubscriberFilters(Object.fromEntries(searchParams))
  const activeCount = countActiveFilters(filters)
  const advancedCount = activeCount - (filters.q ? 1 : 0)
  const [panelOpen, setPanelOpen] = useState(advancedCount > 0)

  // Última query enviada e a URL vista naquele momento. Enquanto a navegação
  // anterior não termina, a URL ainda está desatualizada; partir da query
  // enviada evita que duas alterações rápidas se sobrescrevam.
  const lastSent = useRef<{ seenUrl: string; query: string } | null>(null)

  const navigate = (query: string) => {
    lastSent.current = { seenUrl: searchParams.toString(), query }
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  const update = (changes: Partial<Record<FilterKey, string | undefined>>) => {
    const currentUrl = searchParams.toString()
    const base =
      lastSent.current?.seenUrl === currentUrl
        ? lastSent.current.query
        : currentUrl
    const params = new URLSearchParams(base)
    for (const [key, value] of Object.entries(changes)) {
      const name = FILTER_PARAM[key as FilterKey]
      if (value) params.set(name, value)
      else params.delete(name)
    }
    params.delete(FILTER_PARAM.pagina)
    navigate(params.toString())
  }

  const clearAll = () => navigate("")

  const [q, setQ] = useDraftValue(filters.q ?? "", (value) =>
    update({ q: value.trim() || undefined })
  )
  const [diaDe, setDiaDe] = useDraftValue(String(filters.diaDe ?? ""), (value) =>
    update({ diaDe: value || undefined })
  )
  const [diaAte, setDiaAte] = useDraftValue(
    String(filters.diaAte ?? ""),
    (value) => update({ diaAte: value || undefined })
  )

  const dayValue = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 2)
    if (!digits) return ""
    return String(Math.min(31, Math.max(1, Number(digits))))
  }

  return (
    <section
      aria-label="Pesquisa e filtros"
      className="rounded-xl border bg-card p-3 sm:p-4 print:hidden"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Pesquisar por nome, telefone ou endereço"
          aria-label="Pesquisar assinantes"
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="subscriber-filter-panel"
            className="flex-1 sm:flex-none"
          >
            <SlidersHorizontalIcon aria-hidden />
            Filtros
            {advancedCount > 0 ? (
              <Badge variant="brand" className="tabular-nums">
                {advancedCount}
              </Badge>
            ) : null}
          </Button>
          {activeCount > 0 ? (
            <Button variant="ghost" onClick={clearAll}>
              <XIcon aria-hidden />
              Limpar
              <span className="sr-only">todos os filtros</span>
            </Button>
          ) : null}
          <span className="grid size-5 place-items-center" aria-live="polite">
            {pending ? (
              <Loader2Icon
                className="size-4 animate-spin text-muted-foreground"
                aria-label="Atualizando resultados"
              />
            ) : null}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {panelOpen ? (
          <motion.div
            id="subscriber-filter-panel"
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-x-3 gap-y-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="Área">
                <Combobox
                  options={areas.map((area) => ({
                    value: area.id,
                    label: area.name,
                  }))}
                  value={filters.area}
                  onChange={(value) => update({ area: value })}
                  placeholder="Todas as áreas"
                  searchPlaceholder="Buscar área…"
                  emptyMessage="Nenhuma área encontrada."
                  clearable
                />
              </FilterField>

              <FilterField label="Mês de referência">
                <Select
                  value={filters.mes ? String(filters.mes) : ALL}
                  onValueChange={(value) =>
                    update({ mes: value === ALL ? undefined : value })
                  }
                >
                  <SelectTrigger aria-label="Mês de referência">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos os meses</SelectItem>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label="Status">
                <Select
                  value={filters.status ?? ALL}
                  onValueChange={(value) =>
                    update({ status: value === ALL ? undefined : value })
                  }
                >
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>

              <FilterField label="Ordenar por">
                <Select
                  value={filters.ordem}
                  onValueChange={(value) =>
                    update({ ordem: value === "nome" ? undefined : value })
                  }
                >
                  <SelectTrigger aria-label="Ordenar por">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome (A–Z)</SelectItem>
                    <SelectItem value="vencimento">
                      Vencimento mais próximo
                    </SelectItem>
                    <SelectItem value="recentes">
                      Cadastro mais recente
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>

              <fieldset className="sm:col-span-2">
                <legend className="type-caption mb-1.5 text-muted-foreground">
                  Período de vencimento
                </legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Input
                    type="date"
                    aria-label="Vencimento a partir de"
                    value={filters.vencDe ?? ""}
                    max={filters.vencAte}
                    onChange={(event) =>
                      update({ vencDe: event.target.value || undefined })
                    }
                  />
                  <span className="type-caption text-muted-foreground">até</span>
                  <Input
                    type="date"
                    aria-label="Vencimento até"
                    value={filters.vencAte ?? ""}
                    min={filters.vencDe}
                    onChange={(event) =>
                      update({ vencAte: event.target.value || undefined })
                    }
                  />
                </div>
              </fieldset>

              <fieldset className="sm:col-span-2">
                <legend className="type-caption mb-1.5 text-muted-foreground">
                  Dia do vencimento (1 a 31)
                </legend>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Do dia"
                    aria-label="Dia do vencimento, a partir de"
                    value={diaDe}
                    onChange={(event) => setDiaDe(dayValue(event.target.value))}
                  />
                  <span className="type-caption text-muted-foreground">até</span>
                  <Input
                    inputMode="numeric"
                    placeholder="Ao dia"
                    aria-label="Dia do vencimento, até"
                    value={diaAte}
                    onChange={(event) => setDiaAte(dayValue(event.target.value))}
                  />
                </div>
                <p className="type-caption mt-1.5 font-normal text-muted-foreground">
                  Para um dia específico, repita o mesmo número nos dois campos.
                </p>
              </fieldset>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
