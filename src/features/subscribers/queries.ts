import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type QueryConstraint,
} from "firebase/firestore"

import { listAreaOptions } from "@/features/areas/queries"
import { getDb } from "@/lib/firebase/client"
import { tsToISO } from "@/lib/firebase/firestore-helpers"
import { normalizeSearch } from "@/lib/utils/format"
import type { Subscriber } from "@/types/database"

import {
  PAGE_SIZE,
  searchTerms,
  type SubscriberFilters,
} from "./filters"

export type SubscriberListItem = Pick<
  Subscriber,
  | "id"
  | "name"
  | "address"
  | "phone"
  | "due_date"
  | "reference_month"
  | "status"
  | "label_enabled"
> & { area: { id: string; name: string } | null }

/**
 * Limite de segurança de leitura. O Firestore não faz busca por texto no
 * servidor; os filtros estruturais mais comuns (área/status/mês) são aplicados
 * no servidor e o restante (texto, faixas de dia, ordenação e paginação) é
 * resolvido em memória. Para bases muito grandes, migrar a busca para uma
 * extensão como Algolia/Typesense.
 */
const READ_CAP = 3000
export const MAX_LABELS = 3000

type SubscriberRecord = Subscriber & { search_text: string }

function mapSubscriber(id: string, data: Record<string, unknown>): Subscriber {
  const due_date = (data.due_date as string) ?? ""
  return {
    id,
    name: (data.name as string) ?? "",
    address: (data.address as string) ?? "",
    phone: (data.phone as string) ?? "",
    area_id: (data.area_id as string) ?? "",
    due_date,
    due_day:
      typeof data.due_day === "number"
        ? data.due_day
        : Number(due_date.slice(8, 10)) || 0,
    reference_month: (data.reference_month as number) ?? 0,
    observation: (data.observation as string) ?? "",
    status: data.status === "inactive" ? "inactive" : "active",
    label_enabled: data.label_enabled !== false,
    created_at: tsToISO(data.created_at),
    updated_at: tsToISO(data.updated_at),
  }
}

/** Escolhe um único filtro de igualdade para aplicar no servidor (índice automático). */
function serverConstraint(filters: SubscriberFilters): QueryConstraint[] {
  if (filters.area) return [where("area_id", "==", filters.area)]
  if (filters.status) return [where("status", "==", filters.status)]
  if (filters.mes) return [where("reference_month", "==", filters.mes)]
  return []
}

/** Carrega os candidatos (leitura no servidor) e aplica todos os filtros em memória. */
async function loadFiltered(
  filters: SubscriberFilters
): Promise<SubscriberRecord[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), "subscribers"), ...serverConstraint(filters), limit(READ_CAP))
  )

  const terms = searchTerms(filters.q)
  const records: SubscriberRecord[] = []

  for (const d of snapshot.docs) {
    const subscriber = mapSubscriber(d.id, d.data())
    if (filters.area && subscriber.area_id !== filters.area) continue
    if (filters.status && subscriber.status !== filters.status) continue
    if (filters.mes && subscriber.reference_month !== filters.mes) continue
    if (filters.vencDe && subscriber.due_date < filters.vencDe) continue
    if (filters.vencAte && subscriber.due_date > filters.vencAte) continue
    if (filters.diaDe && subscriber.due_day < filters.diaDe) continue
    if (filters.diaAte && subscriber.due_day > filters.diaAte) continue

    const searchText = normalizeSearch(
      `${subscriber.name} ${subscriber.address} ${subscriber.phone}`
    )
    if (terms.length && !terms.every((term) => searchText.includes(term))) continue

    records.push({ ...subscriber, search_text: searchText })
  }

  const compare: Record<SubscriberFilters["ordem"], (a: Subscriber, b: Subscriber) => number> = {
    nome: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
    vencimento: (a, b) => a.due_date.localeCompare(b.due_date),
    recentes: (a, b) => b.created_at.localeCompare(a.created_at),
  }
  records.sort((a, b) => compare[filters.ordem](a, b) || a.id.localeCompare(b.id))

  return records
}

export type SubscriberPage = {
  items: SubscriberListItem[]
  total: number
  page: number
  pageCount: number
}

async function areaNameMap(): Promise<Map<string, string>> {
  const areas = await listAreaOptions()
  return new Map(areas.map((area) => [area.id, area.name]))
}

function toListItem(
  subscriber: Subscriber,
  areas: Map<string, string>
): SubscriberListItem {
  const name = areas.get(subscriber.area_id)
  return {
    id: subscriber.id,
    name: subscriber.name,
    address: subscriber.address,
    phone: subscriber.phone,
    due_date: subscriber.due_date,
    reference_month: subscriber.reference_month,
    status: subscriber.status,
    label_enabled: subscriber.label_enabled,
    area: name ? { id: subscriber.area_id, name } : null,
  }
}

/** Página de assinantes com filtros, ordenação e paginação. */
export async function listSubscribers(
  filters: SubscriberFilters
): Promise<SubscriberPage> {
  const [records, areas] = await Promise.all([loadFiltered(filters), areaNameMap()])
  const total = records.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(filters.pagina, pageCount)
  const from = (page - 1) * PAGE_SIZE

  return {
    items: records
      .slice(from, from + PAGE_SIZE)
      .map((record) => toListItem(record, areas)),
    total,
    page,
    pageCount,
  }
}

export async function getSubscriber(id: string): Promise<Subscriber | null> {
  if (!id) return null
  const snapshot = await getDoc(doc(getDb(), "subscribers", id))
  return snapshot.exists() ? mapSubscriber(snapshot.id, snapshot.data()) : null
}

export type LabelSubscribers = {
  items: SubscriberListItem[]
  withoutLabel: number
  truncated: boolean
}

/** Assinantes para a folha de etiquetas (respeita `label_enabled`). */
export async function listSubscribersForLabels(
  filters: SubscriberFilters
): Promise<LabelSubscribers> {
  const [records, areas] = await Promise.all([loadFiltered(filters), areaNameMap()])
  const withLabel = records.filter((record) => record.label_enabled)
  return {
    items: withLabel
      .slice(0, MAX_LABELS)
      .map((record) => toListItem(record, areas)),
    withoutLabel: records.length - withLabel.length,
    truncated: withLabel.length > MAX_LABELS,
  }
}
