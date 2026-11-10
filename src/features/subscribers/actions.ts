import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { z } from "zod"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { onlyDigits } from "@/lib/utils/format"
import {
  subscriberSchema,
  type SubscriberInput,
} from "@/lib/validations/subscriber"

/** Converte os dados do formulário no documento gravado no Firestore. */
function toDocument(input: SubscriberInput) {
  const due_date = input.due_date
  return {
    name: input.name,
    address: input.address,
    phone: onlyDigits(input.phone),
    area_id: input.area_id,
    due_date,
    due_day: Number(due_date.slice(8, 10)) || 0,
    reference_month: input.reference_month,
    observation: input.observation,
    status: input.status,
    label_enabled: input.label_enabled,
  }
}

export async function createSubscriber(
  input: SubscriberInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = subscriberSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(
      "Confira os campos destacados.",
      z.flattenError(parsed.error).fieldErrors
    )
  }
  try {
    const ref = await addDoc(collection(getDb(), "subscribers"), {
      ...toDocument(parsed.data),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Assinante cadastrado.", data: { id: ref.id } }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function updateSubscriber(
  id: string,
  input: SubscriberInput
): Promise<ActionResult> {
  const parsed = subscriberSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(
      "Confira os campos destacados.",
      z.flattenError(parsed.error).fieldErrors
    )
  }
  try {
    const ref = doc(getDb(), "subscribers", id)
    if (!(await getDoc(ref)).exists()) {
      return actionError("Assinante não encontrado.")
    }
    await updateDoc(ref, {
      ...toDocument(parsed.data),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Alterações salvas." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  try {
    const ref = doc(getDb(), "subscribers", id)
    if (!(await getDoc(ref)).exists()) {
      return actionError("Assinante não encontrado.")
    }
    await deleteDoc(ref)
    return { ok: true, message: "Assinante excluído." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
