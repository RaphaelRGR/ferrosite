import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/**
 * Cliente anônimo sem cookies para o site público (18): lê SÓ a projeção
 * `public_publication` (view liberada para anon). Sem sessão, sem persistência.
 * Ausência de configuração ⇒ null: as páginas caem no staging/estado vazio.
 */
export function createPublicClient(): SupabaseClient<Database> | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createSupabaseClient<Database>(env.url, env.anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
