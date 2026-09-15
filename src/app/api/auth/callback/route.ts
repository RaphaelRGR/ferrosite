/**
 * Callback de auth do Supabase (magic link / OAuth, fluxo PKCE).
 * Troca o `code` por sessão (cookies) e redireciona apenas para destinos da
 * allowlist. Código ausente/inválido nunca cria sessão (21).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { safeNextPath } from '@/lib/auth/redirects';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=config`, 307);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=callback`, 307);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=callback`, 307);
  }
  return NextResponse.redirect(`${origin}${next}`, 307);
}
