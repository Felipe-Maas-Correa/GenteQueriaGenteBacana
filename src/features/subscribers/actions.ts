"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  NotAuthorizedError,
  requireStaffForAction,
} from "@/features/authentication/session"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { onlyDigits } from "@/lib/utils/format"
import {
  subscriberSchema,
  type SubscriberInput,
} from "@/lib/validations/subscriber"

const idSchema = z.uuid()

function revalidateSubscribers() {
  revalidatePath("/admin/assinantes", "layout")
  revalidatePath("/admin/dashboard")
  revalidatePath("/admin/areas")
}

function databaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "23503":
      return "A área selecionada não existe mais. Escolha outra área."
    case "23514":
      return "Algum dos dados informados é inválido. Confira os campos."
    case "42501":
      return "Você não tem permissão para realizar esta ação."
    default:
      return "Não foi possível salvar. Tente novamente."
  }
}

function toRow(input: SubscriberInput) {
  return { ...input, phone: onlyDigits(input.phone) }
}

async function run<T>(
  work: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof NotAuthorizedError) return actionError(error.message)
    throw error
  }
}

export async function createSubscriber(
  input: SubscriberInput
): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { supabase } = await requireStaffForAction()

    const parsed = subscriberSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(
        "Confira os campos destacados.",
        z.flattenError(parsed.error).fieldErrors
      )
    }

    const { data, error } = await supabase
      .from("subscribers")
      .insert(toRow(parsed.data))
      .select("id")
      .single()
    if (error) return actionError(databaseErrorMessage(error.code))

    revalidateSubscribers()
    return { ok: true, message: "Assinante cadastrado.", data: { id: data.id } }
  })
}

export async function updateSubscriber(
  id: string,
  input: SubscriberInput
): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaffForAction()

    if (!idSchema.safeParse(id).success) {
      return actionError("Assinante não encontrado.")
    }
    const parsed = subscriberSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(
        "Confira os campos destacados.",
        z.flattenError(parsed.error).fieldErrors
      )
    }

    const { data, error } = await supabase
      .from("subscribers")
      .update(toRow(parsed.data))
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) return actionError(databaseErrorMessage(error.code))
    if (!data) return actionError("Assinante não encontrado.")

    revalidateSubscribers()
    return { ok: true, message: "Alterações salvas." }
  })
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaffForAction()

    if (!idSchema.safeParse(id).success) {
      return actionError("Assinante não encontrado.")
    }

    const { data, error } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) return actionError(databaseErrorMessage(error.code))
    if (!data) return actionError("Assinante não encontrado.")

    revalidateSubscribers()
    return { ok: true, message: "Assinante excluído." }
  })
}
