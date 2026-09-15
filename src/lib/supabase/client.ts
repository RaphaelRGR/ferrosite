import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseEnv } from './env'

/**
 * createClient
 * Supabase client para Client Components (somente chaves públicas).
 */
export function createClient() {
  const env = getSupabaseEnv()
  if (!env) throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)')
  return createBrowserClient(env.url, env.anonKey)
}
