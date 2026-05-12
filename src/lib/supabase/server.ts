import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * createClient
 * Retorna o Supabase client para uso em Server Components e Server Actions.
 * Lê e escreve cookies para manter a sessão do usuário via SSR.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
