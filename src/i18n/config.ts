/**
 * Locales do site público. `pt` é o default; URLs públicas são sempre
 * prefixadas (`/pt/...`, `/en/...`) — locale explícito (24).
 * O Portal (`/portal/**`) não é prefixado: escopo PT/EN do Portal é decisão pendente (33).
 */
export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

/** Cookie que registra a escolha explícita do usuário (respeitada pelo proxy). */
export const LOCALE_COOKIE = "locale";

/** Tag BCP 47 usada em <html lang>, hreflang e Intl. */
export const LOCALE_TAGS: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
};

export function hasLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Separa o locale do restante do caminho: "/en/curso" -> { locale: "en", rest: "/curso" }. */
export function splitLocale(pathname: string): { locale: Locale | null; rest: string } {
  const [, first = "", ...others] = pathname.split("/");
  if (hasLocale(first)) return { locale: first, rest: "/" + others.join("/") };
  return { locale: null, rest: pathname };
}

/** Prefixa um caminho interno com o locale: ("en", "/curso") -> "/en/curso". */
export function localizePath(locale: Locale, path: string): string {
  const rest = splitLocale(path).rest.replace(/^\/+/, "");
  return rest ? `/${locale}/${rest}` : `/${locale}`;
}

/** Negocia o locale a partir de Accept-Language ("en-US,en;q=0.9,pt;q=0.8" -> "en"). */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((item) => item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  const match = ranked.find((item) => hasLocale(item.lang));
  return match ? (match.lang as Locale) : DEFAULT_LOCALE;
}
