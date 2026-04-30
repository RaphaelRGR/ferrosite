/**
 * Middleware do Supabase
 * Utilitário responsável por gerenciar a sessão do usuário durante as requisições no Next.js.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Implementar a lógica de atualização da sessão
export async function updateSession(request: NextRequest) {
  // Placeholder
  return NextResponse.next();
}
