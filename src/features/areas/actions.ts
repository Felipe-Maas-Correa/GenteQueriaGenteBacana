import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { normalizeSearch } from "@/lib/utils/format"
import { areaSchema, type AreaInput } from "@/lib/validations/area"

/**
 * O Firestore não tem restrição de unicidade: comparamos o nome normalizado
 * (sem acentos, minúsculo) com as áreas existentes antes de gravar.
 */
async function nameInUse(
  name: string,
  ignoreId: string | null
): Promise<boolean> {
  const normalized = normalizeSearch(name)
  const snapshot = await getDocs(collection(getDb(), "areas"))
  return snapshot.docs.some(
    (d) =>
      d.id !== ignoreId &&
      normalizeSearch((d.data().name as string) ?? "") === normalized
  )
}

export async function saveArea(
  id: string | null,
  input: AreaInput
): Promise<ActionResult> {
  const parsed = areaSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Confira os campos destacados.", {
      name: parsed.error.issues
        .filter((issue) => issue.path[0] === "name")
        .map((issue) => issue.message),
    })
  }

  try {
    if (await nameInUse(parsed.data.name, id)) {
      return actionError("Já existe uma área com este nome.", {
        name: ["Já existe uma área com este nome."],
      })
    }

    const db = getDb()
    if (id === null) {
      await addDoc(collection(db, "areas"), {
        ...parsed.data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      return { ok: true, message: "Área cadastrada." }
    }

    const ref = doc(db, "areas", id)
    if (!(await getDoc(ref)).exists()) return actionError("Área não encontrada.")
    await updateDoc(ref, { ...parsed.data, updated_at: serverTimestamp() })
    return { ok: true, message: "Alterações salvas." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function deleteArea(id: string): Promise<ActionResult> {
  try {
    const db = getDb()
    const countSnapshot = await getCountFromServer(
      query(collection(db, "subscribers"), where("area_id", "==", id))
    )
    if (countSnapshot.data().count > 0) {
      return actionError(
        "Esta área possui assinantes vinculados. Mova-os para outra área antes de excluir."
      )
    }
    await deleteDoc(doc(db, "areas", id))
    return { ok: true, message: "Área excluída." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
