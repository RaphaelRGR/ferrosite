import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * updateSession
 * Chamado pelo middleware principal (src/middleware.ts).
 * Atualiza o cookie de sessão do Supabase a cada request,
 * garantindo que tokens expirados sejam renovados automaticamente.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  // Guard: se as variáveis forem placeholders ou estiverem vazias,
  // não tenta criar o cliente para evitar crash em desenvolvimento.
  if (!url || !key || url.includes('placeholder')) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Atualiza a sessão — não remova essa linha
  await supabase.auth.getUser()

  return supabaseResponse
}
