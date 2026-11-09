import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv, isSupabaseConfigured } from "./env"

const LOGIN_PATH = "/login"
const ADMIN_PREFIX = "/admin"
const ADMIN_HOME = "/admin/dashboard"

/**
 * Renova a sessão do Supabase a cada requisição e aplica o redirecionamento
 * inicial das rotas administrativas. A autorização definitiva acontece no
 * servidor (features/authentication) e no banco (RLS).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) return response

  const { url, publishableKey } = getSupabaseEnv()
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Não execute código entre createServerClient e getClaims: é esta chamada
  // que valida o token e renova a sessão quando necessário.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims)
  const { pathname } = request.nextUrl

  const redirectTo = (path: string, withNext = false) => {
    const target = request.nextUrl.clone()
    target.pathname = path
    target.search = ""
    if (withNext) target.searchParams.set("next", pathname)
    const redirect = NextResponse.redirect(target)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }

  if (pathname.startsWith(ADMIN_PREFIX) && !isAuthenticated) {
    return redirectTo(LOGIN_PATH, true)
  }

  if (pathname === LOGIN_PATH && isAuthenticated) {
    return redirectTo(ADMIN_HOME)
  }

  return response
}
