"use server"

import { redirect } from "next/navigation"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

const ADMIN_HOME = "/admin/dashboard"

/** Aceita apenas caminhos internos do painel como destino pós-login. */
function safeNextPath(next: string | undefined): string {
  if (next && next.startsWith("/admin") && !next.startsWith("//")) return next
  return ADMIN_HOME
}

function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos."
    case "email_not_confirmed":
      return "Este e-mail ainda não foi confirmado."
    case "user_banned":
      return "Este usuário está bloqueado."
    case "over_request_rate_limit":
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente."
    default:
      return "Não foi possível entrar. Tente novamente."
  }
}

export async function signIn(
  input: LoginInput,
  next?: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return actionError(
      "O Supabase ainda não foi configurado neste ambiente."
    )
  }

  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return actionError("Confira os campos informados.")
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return actionError(authErrorMessage(error.code))

  redirect(safeNextPath(next))
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect("/login")
}
