import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from './env'

/**
 * createClient
 * Supabase client para Client Components (somente chaves públicas).
 */
export function createClient() {
  const env = getSupabaseEnv()
  if (!env) throw new Error('Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)')
  return createBrowserClient<Database>(env.url, env.anonKey)
}
