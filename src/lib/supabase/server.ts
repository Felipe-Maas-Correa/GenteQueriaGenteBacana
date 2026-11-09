import "server-only"

import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

import type { Database } from "@/types/database"

import { getSupabaseEnv } from "./env"

export type AppSupabaseClient = SupabaseClient<Database>

/** Cliente Supabase para Server Components, Server Actions e Route Handlers. */
export async function createClient(): Promise<AppSupabaseClient> {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseEnv()

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components não podem gravar cookies; a renovação da sessão
          // é feita pelo proxy (src/proxy.ts).
        }
      },
    },
  })
}
