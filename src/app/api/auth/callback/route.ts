/**
 * Rota de Callback OAuth do Supabase
 * Rota de API responsável por lidar com o retorno da autenticação do Supabase.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // TODO: Implementar troca do código de autorização pela sessão no Supabase
  return NextResponse.redirect(new URL('/portal', request.url));
}
