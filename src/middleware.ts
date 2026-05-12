import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * middleware
 * Intercepta todos os requests para rotas protegidas.
 * Atualiza a sessão do Supabase e redireciona para /login
 * se o usuário não estiver autenticado ao acessar /portal/*.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
