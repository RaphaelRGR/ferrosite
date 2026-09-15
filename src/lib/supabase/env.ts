/**
 * Configuração pública do Supabase (URL + anon key). Ausente ⇒ o Portal falha
 * fechado (21): nenhuma rota privada é servida sem auth configurada.
 * A chave privilegiada (service role) nunca passa por aqui.
 */
export interface SupabasePublicEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey || url.includes("placeholder")) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
