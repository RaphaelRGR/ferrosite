import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente com service role — SÓ para Server Actions/rotas do servidor que
 * precisam executar funções restritas ao service role (ex.: envio do
 * formulário público "Tenho um desafio"). Nunca importar de Client Components;
 * a chave vem de variável sem prefixo NEXT_PUBLIC e nunca vai ao browser.
 * Sem sessão de usuário, sem cookies, sem persistência.
 */
export function createAdminClient(): SupabaseClient<Database> | null {
  if (typeof window !== "undefined") throw new Error("createAdminClient só pode ser usado no servidor");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key || url.includes("placeholder")) return null;
  return createSupabaseClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
