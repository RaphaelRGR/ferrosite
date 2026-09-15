import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { DEFAULT_LOCALE, hasLocale, LOCALE_COOKIE, negotiateLocale, splitLocale } from '@/i18n/config'

/**
 * proxy (ex-middleware, convenção renomeada no Next 16)
 * 1. Roteamento por locale do site público: caminhos sem prefixo (`/`, `/curso`)
 *    redirecionam para `/{locale}/...` — cookie de escolha > Accept-Language > pt.
 *    307 (não permanente) porque o destino depende da preferência do visitante;
 *    canonical/hreflang cuidam do SEO (24).
 * 2. Atualiza a sessão Supabase (comportamento anterior preservado).
 * AUTH-002: o guard de `/portal/**` entra aqui, fail-closed.
 */
const UNPREFIXED_PREFIXES = ['/portal', '/api', '/design-system']

function needsLocale(pathname: string): boolean {
  if (UNPREFIXED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false
  if (/\.[a-z0-9]+$/i.test(pathname)) return false // arquivos estáticos (pdf, html, png...)
  return splitLocale(pathname).locale === null
}

function chooseLocale(request: NextRequest) {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (hasLocale(fromCookie)) return fromCookie
  return negotiateLocale(request.headers.get('accept-language')) ?? DEFAULT_LOCALE
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (needsLocale(pathname)) {
    const url = request.nextUrl.clone()
    const rest = pathname === '/' ? '' : pathname
    url.pathname = `/${chooseLocale(request)}${rest}`
    return NextResponse.redirect(url, 307)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp4|pdf|html)$).*)',
  ],
}
