import { collection, getDocs, limit, query } from "firebase/firestore"

import { listAreaOptions } from "@/features/areas/queries"
import type { SubscriberListItem } from "@/features/subscribers/queries"
import { getDb } from "@/lib/firebase/client"
import { diffInDays, todayISO } from "@/lib/utils/format"
import type { SubscriberStatus } from "@/types/database"

export type DashboardStats = {
  total: number
  active: number
  inactive: number
  overdue: number
  due_next_7_days: number
  due_next_30_days: number
  by_area: { id: string; name: string; count: number }[]
  by_month: { month: number; count: number }[]
}

export type DashboardData = {
  stats: DashboardStats
  upcoming: SubscriberListItem[]
}

const READ_CAP = 5000

type Row = {
  id: string
  name: string
  address: string
  phone: string
  area_id: string
  due_date: string
  reference_month: number
  status: SubscriberStatus
  label_enabled: boolean
}

/**
 * Indicadores do dashboard. Como o Firestore não agrega no servidor sem
 * índices por combinação, lemos a base (limitada) e calculamos em memória —
 * adequado à escala de um jornal regional.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const db = getDb()
  const [areas, snapshot] = await Promise.all([
    listAreaOptions(),
    getDocs(query(collection(db, "subscribers"), limit(READ_CAP))),
  ])

  const rows: Row[] = snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: (data.name as string) ?? "",
      address: (data.address as string) ?? "",
      phone: (data.phone as string) ?? "",
      area_id: (data.area_id as string) ?? "",
      due_date: (data.due_date as string) ?? "",
      reference_month: (data.reference_month as number) ?? 0,
      status: data.status === "inactive" ? "inactive" : "active",
      label_enabled: data.label_enabled !== false,
    }
  })

  const today = todayISO()
  const active = rows.filter((r) => r.status === "active")

  const byArea = areas.map((area) => ({
    id: area.id,
    name: area.name,
    count: rows.filter((r) => r.area_id === area.id).length,
  }))
  byArea.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"))

  const byMonth = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    count: rows.filter((r) => r.reference_month === index + 1).length,
  }))

  const stats: DashboardStats = {
    total: rows.length,
    active: active.length,
    inactive: rows.length - active.length,
    overdue: active.filter((r) => r.due_date && r.due_date < today).length,
    due_next_7_days: active.filter(
      (r) => r.due_date >= today && diffInDays(today, r.due_date) <= 7
    ).length,
    due_next_30_days: active.filter(
      (r) => r.due_date >= today && diffInDays(today, r.due_date) <= 30
    ).length,
    by_area: byArea,
    by_month: byMonth,
  }

  const areaName = new Map(areas.map((area) => [area.id, area.name]))
  const upcoming: SubscriberListItem[] = active
    .filter((r) => r.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      phone: r.phone,
      due_date: r.due_date,
      reference_month: r.reference_month,
      status: r.status,
      label_enabled: r.label_enabled,
      area: areaName.has(r.area_id)
        ? { id: r.area_id, name: areaName.get(r.area_id)! }
        : null,
    }))

  return { stats, upcoming }
}
