import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

/**
 * Cliente Supabase com a sessão do usuário (cookies) para Server Components,
 * Server Actions e Route Handlers. Lança se a configuração estiver ausente:
 * chamadores do Portal já foram barrados pelo proxy (fail-closed), então isto
 * é defesa em profundidade.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)");
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component: cookies são somente leitura; o proxy renova a sessão.
        }
      },
    },
  });
}
