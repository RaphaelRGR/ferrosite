/**
 * Inventário das rotas existentes no protótipo (auditoria 2026-09-14).
 * Usado pelo smoke, pelo crawler de links e pela captura de screenshots.
 */
// Caminhos públicos sem prefixo de locale (I18N-001 prefixa: /pt/..., /en/...).
export const PUBLIC_PATHS = ["/", "/curso", "/sobre", "/visitas", "/eventos", "/noticias", "/simuladores"] as const;
export const LOCALES = ["pt", "en"] as const;

export function localized(locale: (typeof LOCALES)[number], path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export const PUBLIC_ROUTES = LOCALES.flatMap((locale) => PUBLIC_PATHS.map((path) => localized(locale, path)));

// Sem autenticação efetiva ainda: hoje respondem 200 para anônimo (AUTH-002 muda isso).
export const PORTAL_ROUTES = [
  "/portal",
  "/portal/projetos",
  "/portal/questoes",
  "/portal/acervo",
] as const;

// Catálogo de componentes (ferramenta de desenvolvimento, noindex, fora da navegação).
export const CATALOG_ROUTE = "/design-system";

export const HTML_ROUTES = [...PUBLIC_ROUTES, ...PORTAL_ROUTES, CATALOG_ROUTE] as const;

// Grades legadas: precisam continuar servidas como fallback documental.
export const GRADE_ASSETS = [
  "/grades/fluxo2025.html",
  "/grades/fluxo2016.html",
  "/grades/fluxo2012.html",
  "/grades/grade2025.pdf",
  "/grades/grade2016.pdf",
  "/grades/grade2012.pdf",
] as const;

/** Nome de arquivo seguro para uma rota (ex.: "/portal/projetos" -> "portal__projetos"). */
export function routeSlug(route: string): string {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "__");
}
