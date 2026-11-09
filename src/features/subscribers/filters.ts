import { normalizeSearch, onlyDigits } from "@/lib/utils/format"
import type { SubscriberStatus } from "@/types/database"

/**
 * Filtros da listagem de assinantes. Vivem na URL (query string), o que torna
 * qualquer combinação compartilhável e reaproveitável na geração de etiquetas.
 */
export type SubscriberSort = "nome" | "vencimento" | "recentes"

export type SubscriberFilters = {
  q?: string
  area?: string
  mes?: number
  status?: SubscriberStatus
  /** Vencimento a partir de (AAAA-MM-DD). */
  vencDe?: string
  /** Vencimento até (AAAA-MM-DD). */
  vencAte?: string
  /** Dia do vencimento — início do intervalo (1–31). */
  diaDe?: number
  /** Dia do vencimento — fim do intervalo (1–31). */
  diaAte?: number
  ordem: SubscriberSort
  pagina: number
}

export const FILTER_PARAM = {
  q: "q",
  area: "area",
  mes: "mes",
  status: "status",
  vencDe: "venc_de",
  vencAte: "venc_ate",
  diaDe: "dia_de",
  diaAte: "dia_ate",
  ordem: "ordem",
  pagina: "pagina",
} as const

export const PAGE_SIZE = 20

type RawParams = Record<string, string | string[] | undefined>

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return v?.trim() || undefined
}

function intInRange(
  value: string | undefined,
  min: number,
  max: number
): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n >= min && n <= max ? n : undefined
}

/** Converte a query string em filtros válidos; valores inválidos são ignorados. */
export function parseSubscriberFilters(raw: RawParams): SubscriberFilters {
  const get = (key: keyof typeof FILTER_PARAM) => first(raw[FILTER_PARAM[key]])

  const area = get("area")
  const status = get("status")
  const vencDe = get("vencDe")
  const vencAte = get("vencAte")
  const ordem = get("ordem")

  return {
    q: get("q")?.slice(0, 120),
    area: area && UUID_RE.test(area) ? area : undefined,
    mes: intInRange(get("mes"), 1, 12),
    status: status === "active" || status === "inactive" ? status : undefined,
    vencDe: vencDe && DATE_RE.test(vencDe) ? vencDe : undefined,
    vencAte: vencAte && DATE_RE.test(vencAte) ? vencAte : undefined,
    diaDe: intInRange(get("diaDe"), 1, 31),
    diaAte: intInRange(get("diaAte"), 1, 31),
    ordem: ordem === "vencimento" || ordem === "recentes" ? ordem : "nome",
    pagina: intInRange(get("pagina"), 1, 100_000) ?? 1,
  }
}

/** Serializa os filtros de volta para a query string (omitindo padrões). */
export function filtersToSearchParams(
  filters: Partial<SubscriberFilters>
): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: keyof typeof FILTER_PARAM, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(FILTER_PARAM[key], String(value))
    }
  }
  set("q", filters.q)
  set("area", filters.area)
  set("mes", filters.mes)
  set("status", filters.status)
  set("vencDe", filters.vencDe)
  set("vencAte", filters.vencAte)
  set("diaDe", filters.diaDe)
  set("diaAte", filters.diaAte)
  if (filters.ordem && filters.ordem !== "nome") set("ordem", filters.ordem)
  if (filters.pagina && filters.pagina > 1) set("pagina", filters.pagina)
  return params
}

export function countActiveFilters(filters: SubscriberFilters): number {
  return [
    filters.q,
    filters.area,
    filters.mes,
    filters.status,
    filters.vencDe ?? filters.vencAte,
    filters.diaDe ?? filters.diaAte,
  ].filter((value) => value !== undefined).length
}

/**
 * Divide a pesquisa geral em termos já normalizados (sem acentos, minúsculos).
 * Um termo com cara de telefone — "(55) 99999-0000" — vira apenas dígitos,
 * pois é assim que o telefone é armazenado.
 */
export function searchTerms(q: string | undefined): string[] {
  if (!q) return []
  const normalized = normalizeSearch(q)
  if (!normalized) return []

  if (/^[\d\s()+.-]+$/.test(normalized)) {
    const digits = onlyDigits(normalized)
    return digits ? [digits] : []
  }

  return normalized
    .split(/\s+/)
    .map((term) => (/^[\d()+.-]+$/.test(term) ? onlyDigits(term) : term))
    .filter(Boolean)
    .slice(0, 6)
}

/** Escapa curingas do LIKE para que a pesquisa seja sempre literal. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`)
}
