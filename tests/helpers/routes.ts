/**
 * Inventário das rotas existentes no protótipo (auditoria 2026-09-14).
 * Usado pelo smoke, pelo crawler de links e pela captura de screenshots.
 */
// Caminhos públicos sem prefixo de locale (I18N-001 prefixa: /pt/..., /en/...).
export const PUBLIC_PATHS = ["/", "/curso", "/projetos", "/projetos/comunica-ferro", "/sobre", "/experiencias", "/experiencias/visitas.gallery.rumo-2023", "/eventos", "/noticias", "/noticias/noticias.grid.08mai", "/laboratorios", "/laboratorios/lav", "/laboratorios/robotica", "/laboratorios/lasc", "/para-empresas", "/para-empresas/desafio", "/simuladores", "/privacidade"] as const;
// Páginas já migradas para o shell claro (PUBLIC-001): axe estrito.
export const LIGHT_PATHS = [...PUBLIC_PATHS] as const;
export const LOCALES = ["pt", "en"] as const;

export function localized(locale: (typeof LOCALES)[number], path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export const PUBLIC_ROUTES = LOCALES.flatMap((locale) => PUBLIC_PATHS.map((path) => localized(locale, path)));

// Exigem sessão + perfil ativo (AUTH-002): anônimo recebe 307 para /login.
export const PORTAL_ROUTES = [
  "/portal",
  "/portal/coordenacao",
  "/portal/projetos",
  "/portal/questoes",
  "/portal/acervo",
  "/portal/projetos/novo",
  "/portal/projetos/qualquer-slug",
  "/portal/projetos/qualquer-slug/equipe",
  "/portal/projetos/qualquer-slug/missoes",
  "/portal/projetos/qualquer-slug/missoes/nova",
  "/portal/pessoas",
  "/portal/empresas",
  "/portal/empresas/nova",
  "/portal/desafios",
  "/portal/conteudos",
  "/portal/conteudos/novo",
  "/portal/arquivos",
  "/portal/projetos/qualquer-slug/arquivos",
  "/portal/relatorios",
] as const;

// Catálogo de componentes (ferramenta de desenvolvimento, noindex, fora da navegação).
export const CATALOG_ROUTE = "/design-system";

export const LOGIN_ROUTE = "/login";

// Rotas HTML acessíveis sem sessão.
export const HTML_ROUTES = [...PUBLIC_ROUTES, CATALOG_ROUTE, LOGIN_ROUTE] as const;

// PDFs oficiais das matrizes: fonte do fluxograma e link "baixar grade".
export const GRADE_ASSETS = [
  "/grades/grade2025.pdf",
  "/grades/grade2016.pdf",
  "/grades/grade2012.pdf",
] as const;

/** Nome de arquivo seguro para uma rota (ex.: "/portal/projetos" -> "portal__projetos"). */
export function routeSlug(route: string): string {
  return route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "__");
}
