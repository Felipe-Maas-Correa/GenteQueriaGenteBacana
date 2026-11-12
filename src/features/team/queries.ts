import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage, tsToISO } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { normalizeRole } from "@/features/authentication/roles"
import type { Profile, UserRole } from "@/types/database"

/** Usuários do painel. As regras só permitem esta leitura a administradores. */
export async function listProfiles(): Promise<Profile[]> {
  const snapshot = await getDocs(collection(getDb(), "profiles"))
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        id: d.id,
        name: (data.name as string) ?? "",
        email: (data.email as string) ?? "",
        role: normalizeRole(data.role),
        photo_url: (data.photo_url as string) ?? "",
        disabled: data.disabled === true,
        created_at: tsToISO(data.created_at),
        updated_at: tsToISO(data.updated_at),
      }
    })
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "pt-BR"))
}

export async function updateProfile(
  id: string,
  changes: { role?: UserRole; name?: string; photo_url?: string; disabled?: boolean }
): Promise<ActionResult> {
  try {
    await updateDoc(doc(getDb(), "profiles", id), {
      ...changes,
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Usuário atualizado." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
