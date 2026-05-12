import { createBrowserClient } from '@supabase/ssr'

/**
 * createClient
 * Retorna o Supabase client para uso em Client Components.
 * Usa as variáveis públicas NEXT_PUBLIC_*.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
