import "server-only"

import { z } from "zod"

import type { SubscriberListItem } from "@/features/subscribers/queries"
import type { AppSupabaseClient } from "@/lib/supabase/server"
import { todayISO } from "@/lib/utils/format"

const statsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  overdue: z.number(),
  due_next_7_days: z.number(),
  due_next_30_days: z.number(),
  by_area: z.array(
    z.object({ id: z.string(), name: z.string(), count: z.number() })
  ),
  by_month: z.array(z.object({ month: z.number(), count: z.number() })),
})

export type DashboardStats = z.infer<typeof statsSchema>

/** Indicadores agregados no banco (função `dashboard_stats`). */
export async function getDashboardStats(
  supabase: AppSupabaseClient
): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("dashboard_stats")
  if (error) throw new Error(error.message)
  return statsSchema.parse(data)
}

/** Próximos vencimentos de assinantes ativos, a partir de hoje. */
export async function getUpcomingDueSubscribers(
  supabase: AppSupabaseClient,
  limit = 6
): Promise<SubscriberListItem[]> {
  const { data, error } = await supabase
    .from("subscribers")
    .select(
      "id, name, address, phone, due_date, reference_month, status, label_enabled, area:areas(id, name)"
    )
    .eq("status", "active")
    .gte("due_date", todayISO())
    .order("due_date")
    .order("name")
    .limit(limit)
  if (error) throw new Error(error.message)
  return data as SubscriberListItem[]
}
