import {
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { tsToISO } from "@/lib/firebase/firestore-helpers"
import type { Area } from "@/types/database"

export type AreaOption = Pick<Area, "id" | "name">
export type AreaWithCount = Area & { subscriberCount: number }

export function mapArea(id: string, data: Record<string, unknown>): Area {
  return {
    id,
    name: (data.name as string) ?? "",
    description: (data.description as string) ?? "",
    created_at: tsToISO(data.created_at),
    updated_at: tsToISO(data.updated_at),
  }
}

/** Áreas em ordem alfabética, para selects e filtros. */
export async function listAreaOptions(): Promise<AreaOption[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), "areas"), orderBy("name"))
  )
  return snapshot.docs.map((d) => ({
    id: d.id,
    name: (d.data().name as string) ?? "",
  }))
}

/** Áreas com a quantidade de assinantes vinculados (consultas de contagem). */
export async function listAreasWithCount(): Promise<AreaWithCount[]> {
  const db = getDb()
  const snapshot = await getDocs(query(collection(db, "areas"), orderBy("name")))

  return Promise.all(
    snapshot.docs.map(async (d) => {
      const countSnapshot = await getCountFromServer(
        query(collection(db, "subscribers"), where("area_id", "==", d.id))
      )
      return {
        ...mapArea(d.id, d.data()),
        subscriberCount: countSnapshot.data().count,
      }
    })
  )
}
