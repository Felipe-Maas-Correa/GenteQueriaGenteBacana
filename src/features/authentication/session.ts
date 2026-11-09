import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient, type AppSupabaseClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type SessionState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: CurrentUser; supabase: AppSupabaseClient }

export type StaffContext = { user: CurrentUser; supabase: AppSupabaseClient }

const STAFF_ROLES: readonly UserRole[] = ["admin", "editor"]

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role)
}

/**
 * Lê e valida a sessão atual (uma vez por requisição).
 * O token é verificado com `getClaims`, e o papel vem da tabela `profiles`.
 */
export const getSession = cache(async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) return { status: "unconfigured" }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return { status: "anonymous" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", claims.sub)
    .maybeSingle()

  const email = profile?.email ?? (typeof claims.email === "string" ? claims.email : "")

  return {
    status: "authenticated",
    supabase,
    user: {
      id: claims.sub,
      name: profile?.name || email.split("@")[0] || "Usuário",
      email,
      role: profile?.role ?? "pending",
    },
  }
})

/**
 * Contexto para leituras do painel. Retorna `null` quando o Supabase ainda não
 * foi configurado (a interface mostra as instruções de configuração) e
 * redireciona quem não está autenticado ou não tem acesso liberado.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const session = await getSession()
  if (session.status === "unconfigured") return null
  if (session.status === "anonymous") redirect("/login")
  if (!isStaff(session.user.role)) redirect("/admin/dashboard")
  return { user: session.user, supabase: session.supabase }
}

export class NotAuthorizedError extends Error {
  constructor(message = "Você não tem permissão para realizar esta ação.") {
    super(message)
    this.name = "NotAuthorizedError"
  }
}

/** Contexto para Server Actions: exige equipe autenticada. */
export async function requireStaffForAction(): Promise<StaffContext> {
  const session = await getSession()
  if (session.status === "unconfigured") {
    throw new NotAuthorizedError(
      "O Supabase ainda não foi configurado. Defina as variáveis de ambiente para salvar dados."
    )
  }
  if (session.status === "anonymous") {
    throw new NotAuthorizedError("Sua sessão expirou. Entre novamente.")
  }
  if (!isStaff(session.user.role)) throw new NotAuthorizedError()
  return { user: session.user, supabase: session.supabase }
}
