/**
 * Variáveis públicas do Supabase. A chave `service_role` nunca é usada pela
 * aplicação: todo acesso a dados passa pelo usuário autenticado e pelas
 * políticas de RLS do banco.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey)
}

export function getSupabaseEnv(): { url: string; publishableKey: string } {
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local."
    )
  }
  return { url, publishableKey }
}
