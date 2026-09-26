import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/auth/redirects";
import { DEFAULT_LOCALE, hasLocale, LOCALE_COOKIE, negotiateLocale, splitLocale } from "@/i18n/config";

/**
 * proxy (ex-middleware, convenção renomeada no Next 16)
 * 1. Roteamento por locale do site público: caminhos sem prefixo (`/`, `/curso`)
 *    redirecionam para `/{locale}/...` (cookie de escolha > Accept-Language > pt).
 *    307 (não permanente) porque o destino depende da preferência do visitante.
 * 2. Guard do Portal (AUTH-002, fail-closed):
 *    - sem configuração do Supabase ⇒ 503 (nunca servir área privada aberta);
 *    - sem sessão válida ⇒ redirect para /login?next=<caminho allowlisted>;
 *    - com sessão ⇒ segue; o layout do Portal ainda exige perfil ATIVO.
 * 3. /login com sessão ⇒ /portal.
 */
const UNPREFIXED_PREFIXES = ["/portal", "/api", "/design-system", "/login", "/og"];
const PORTAL_PREFIX = "/portal";

function needsLocale(pathname: string): boolean {
  if (UNPREFIXED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  if (/\.[a-z0-9]+$/i.test(pathname)) return false; // arquivos estáticos (pdf, html, png...)
  return splitLocale(pathname).locale === null;
}

function isPortalPath(pathname: string): boolean {
  return pathname === PORTAL_PREFIX || pathname.startsWith(`${PORTAL_PREFIX}/`);
}

function chooseLocale(request: NextRequest) {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(fromCookie)) return fromCookie;
  return negotiateLocale(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (needsLocale(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${chooseLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 307);
  }

  const portal = isPortalPath(pathname);

  if (portal && !isSupabaseConfigured()) {
    return new NextResponse("Portal indisponível: autenticação não configurada.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const { response, user } = await updateSession(request);

  if (portal && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", safeNextPath(pathname));
    return NextResponse.redirect(url, 307);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = safeNextPath(request.nextUrl.searchParams.get("next"));
    url.search = "";
    return NextResponse.redirect(url, 307);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|pdf|html)$).*)"],
};
