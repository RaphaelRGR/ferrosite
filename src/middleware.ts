/**
 * Middleware do Next.js
 * Protege as rotas /portal/* garantindo que apenas usuários autenticados tenham acesso.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TODO: Integrar lógica de autenticação do Supabase aqui para proteger as rotas
  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*'],
};
