import "server-only"

import type { AppSupabaseClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export type AreaOption = Pick<Tables<"areas">, "id" | "name">

export type AreaWithCount = Tables<"areas"> & { subscriberCount: number }

/** Áreas em ordem alfabética, para selects e filtros. */
export async function listAreaOptions(
  supabase: AppSupabaseClient
): Promise<AreaOption[]> {
  const { data, error } = await supabase
    .from("areas")
    .select("id, name")
    .order("name")
  if (error) throw new Error(error.message)
  return data
}

/** Áreas com a quantidade de assinantes vinculados. */
export async function listAreasWithCount(
  supabase: AppSupabaseClient
): Promise<AreaWithCount[]> {
  const { data, error } = await supabase
    .from("areas")
    .select("*, subscribers(count)")
    .order("name")
  if (error) throw new Error(error.message)

  return data.map(({ subscribers, ...area }) => ({
    ...area,
    subscriberCount: subscribers[0]?.count ?? 0,
  }))
}
