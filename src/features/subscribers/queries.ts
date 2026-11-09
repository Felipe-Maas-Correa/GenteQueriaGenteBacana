import "server-only"

import type { AppSupabaseClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

import {
  escapeLike,
  PAGE_SIZE,
  searchTerms,
  type SubscriberFilters,
} from "./filters"

export type SubscriberListItem = Pick<
  Tables<"subscribers">,
  | "id"
  | "name"
  | "address"
  | "phone"
  | "due_date"
  | "reference_month"
  | "status"
  | "label_enabled"
> & { area: { id: string; name: string } | null }

const LIST_COLUMNS =
  "id, name, address, phone, due_date, reference_month, status, label_enabled, area:areas(id, name)"

/** Limite de etiquetas por documento, para manter a impressão viável no navegador. */
export const MAX_LABELS = 3000
const LABEL_BATCH = 1000

/**
 * Subconjunto do construtor de consultas do Supabase usado pelos filtros.
 * Permite aplicar a mesma lógica à listagem, à contagem e às etiquetas.
 */
type Filterable<Q> = {
  eq(column: string, value: string | number | boolean): Q
  gte(column: string, value: string | number): Q
  lte(column: string, value: string | number): Q
  ilike(column: string, pattern: string): Q
}

function applyFilters<Q extends Filterable<Q>>(
  query: Q,
  filters: SubscriberFilters
): Q {
  let q = query
  for (const term of searchTerms(filters.q)) {
    q = q.ilike("search_text", `%${escapeLike(term)}%`)
  }
  if (filters.area) q = q.eq("area_id", filters.area)
  if (filters.mes) q = q.eq("reference_month", filters.mes)
  if (filters.status) q = q.eq("status", filters.status)
  if (filters.vencDe) q = q.gte("due_date", filters.vencDe)
  if (filters.vencAte) q = q.lte("due_date", filters.vencAte)
  if (filters.diaDe) q = q.gte("due_day", filters.diaDe)
  if (filters.diaAte) q = q.lte("due_day", filters.diaAte)
  return q
}

const SORT: Record<
  SubscriberFilters["ordem"],
  { column: "name" | "due_date" | "created_at"; ascending: boolean }
> = {
  nome: { column: "name", ascending: true },
  vencimento: { column: "due_date", ascending: true },
  recentes: { column: "created_at", ascending: false },
}

export type SubscriberPage = {
  items: SubscriberListItem[]
  total: number
  page: number
  pageCount: number
}

/** Página de assinantes: filtros, ordenação e paginação resolvidos no banco. */
export async function listSubscribers(
  supabase: AppSupabaseClient,
  filters: SubscriberFilters
): Promise<SubscriberPage> {
  const sort = SORT[filters.ordem]
  const from = (filters.pagina - 1) * PAGE_SIZE

  const base = supabase
    .from("subscribers")
    .select(LIST_COLUMNS, { count: "exact" })

  const { data, count, error } = await applyFilters(base, filters)
    .order(sort.column, { ascending: sort.ascending })
    .order("id", { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  // PGRST103: página além do fim do resultado — tratada como lista vazia.
  if (error && error.code !== "PGRST103") throw new Error(error.message)

  const total = count ?? 0
  return {
    items: (data ?? []) as SubscriberListItem[],
    total,
    page: filters.pagina,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

export async function getSubscriber(
  supabase: AppSupabaseClient,
  id: string
): Promise<Tables<"subscribers"> | null> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) {
    // 22P02: id fora do formato UUID → tratado como "não encontrado".
    if (error.code === "22P02") return null
    throw new Error(error.message)
  }
  return data
}

export type LabelSubscribers = {
  items: SubscriberListItem[]
  /** Assinantes que atendem aos filtros mas optaram por não ter etiqueta. */
  withoutLabel: number
  /** Indica que o resultado foi limitado a MAX_LABELS. */
  truncated: boolean
}

/** Assinantes para a folha de etiquetas (respeita `label_enabled`). */
export async function listSubscribersForLabels(
  supabase: AppSupabaseClient,
  filters: SubscriberFilters
): Promise<LabelSubscribers> {
  const sort = SORT[filters.ordem]
  const items: SubscriberListItem[] = []
  let total = 0

  for (let from = 0; from < MAX_LABELS; from += LABEL_BATCH) {
    const base = supabase
      .from("subscribers")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("label_enabled", true)

    const { data, count, error } = await applyFilters(base, filters)
      .order(sort.column, { ascending: sort.ascending })
      .order("id", { ascending: true })
      .range(from, Math.min(from + LABEL_BATCH, MAX_LABELS) - 1)

    if (error) throw new Error(error.message)
    total = count ?? 0
    items.push(...((data ?? []) as SubscriberListItem[]))
    if (!data || data.length < LABEL_BATCH) break
  }

  const withoutLabelQuery = supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("label_enabled", false)
  const { count: withoutLabel, error } = await applyFilters(
    withoutLabelQuery,
    filters
  )
  if (error) throw new Error(error.message)

  return {
    items,
    withoutLabel: withoutLabel ?? 0,
    truncated: total > items.length,
  }
}
