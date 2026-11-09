"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  NotAuthorizedError,
  requireStaffForAction,
} from "@/features/authentication/session"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { areaSchema, type AreaInput } from "@/lib/validations/area"

const idSchema = z.uuid()

function revalidateAreas() {
  revalidatePath("/admin/areas")
  revalidatePath("/admin/assinantes", "layout")
  revalidatePath("/admin/dashboard")
}

function databaseError(code: string | undefined): ActionResult<never> {
  switch (code) {
    case "23505":
      return actionError("Já existe uma área com este nome.", {
        name: ["Já existe uma área com este nome."],
      })
    case "23001":
    case "23503":
      return actionError(
        "Esta área possui assinantes vinculados. Mova-os para outra área antes de excluir."
      )
    case "42501":
      return actionError("Você não tem permissão para realizar esta ação.")
    default:
      return actionError("Não foi possível salvar. Tente novamente.")
  }
}

async function run(work: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await work()
  } catch (error) {
    if (error instanceof NotAuthorizedError) return actionError(error.message)
    throw error
  }
}

export async function saveArea(
  id: string | null,
  input: AreaInput
): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaffForAction()

    if (id !== null && !idSchema.safeParse(id).success) {
      return actionError("Área não encontrada.")
    }
    const parsed = areaSchema.safeParse(input)
    if (!parsed.success) {
      return actionError(
        "Confira os campos destacados.",
        z.flattenError(parsed.error).fieldErrors
      )
    }

    if (id === null) {
      const { error } = await supabase.from("areas").insert(parsed.data)
      if (error) return databaseError(error.code)
    } else {
      const { data, error } = await supabase
        .from("areas")
        .update(parsed.data)
        .eq("id", id)
        .select("id")
        .maybeSingle()
      if (error) return databaseError(error.code)
      if (!data) return actionError("Área não encontrada.")
    }

    revalidateAreas()
    return {
      ok: true,
      message: id === null ? "Área cadastrada." : "Alterações salvas.",
    }
  })
}

export async function deleteArea(id: string): Promise<ActionResult> {
  return run(async () => {
    const { supabase } = await requireStaffForAction()

    if (!idSchema.safeParse(id).success) {
      return actionError("Área não encontrada.")
    }

    const { data, error } = await supabase
      .from("areas")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle()
    if (error) return databaseError(error.code)
    if (!data) return actionError("Área não encontrada.")

    revalidateAreas()
    return { ok: true, message: "Área excluída." }
  })
}
