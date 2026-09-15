import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'

/**
 * updateSession
 * Chamado pelo proxy (src/proxy.ts). Renova o cookie de sessão a cada request
 * e devolve o usuário autenticado (ou null) para o guard decidir.
 */
export async function updateSession(request: NextRequest): Promise<{ response: NextResponse; user: User | null }> {
  const response = NextResponse.next({ request })
  const env = getSupabaseEnv()
  if (!env) return { response, user: null }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // getUser valida o token no servidor de auth (não confiar em getSession no edge).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
