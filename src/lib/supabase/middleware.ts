import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Chamado pelo proxy (src/proxy.ts) nas rotas que dependem de sessão: renova o
 * cookie quando o token expira e devolve o id do usuário autenticado (ou null).
 *
 * PERF-002: `getClaims` verifica a assinatura do JWT localmente (ES256, JWKS em
 * cache) em vez de consultar o servidor de auth a cada request; só há rede
 * quando o token precisa ser renovado ou a chave ainda não está em cache.
 */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; userId: string | null }> {
  const response = NextResponse.next({ request });
  const env = getSupabaseEnv();
  if (!env) return { response, userId: null };

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  return { response, userId: error ? null : (data?.claims.sub ?? null) };
}
