import type { Metadata } from "next";
import { LOCALE_TAGS, LOCALES, localizePath, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

/**
 * Domínio público — [CONTEÚDO PENDENTE]: definir NEXT_PUBLIC_SITE_URL em produção.
 * Sem ele, canonical/hreflang/sitemap saem relativos a localhost.
 */
// Ordem: variável explícita → domínio de produção que a Vercel injeta (VERCEL_PROJECT_PRODUCTION_URL, sem esquema) → dev local.
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || vercelProd || "http://localhost:3000");

/** canonical + hreflang (pt-BR, en, x-default) para um caminho sem prefixo. */
export function localeAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], localizePath(l, path)]));
  return {
    canonical: localizePath(locale, path),
    languages: { ...languages, "x-default": localizePath("pt", path) },
  };
}

/** Metadata de uma página pública: título/descrição do catálogo, alternates e OG localizado. */
export function publicPageMetadata(
  locale: Locale,
  path: string,
  page: { title: string; description?: string },
): Metadata {
  const dict = getDictionary(locale);
  return {
    title: page.title,
    description: page.description ?? dict.site.description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      title: page.title,
      description: page.description ?? dict.site.description,
      siteName: dict.site.name,
      locale: LOCALE_TAGS[locale].replace("-", "_"),
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_TAGS[l].replace("-", "_")),
      url: localizePath(locale, path),
      type: "website",
    },
  };
}
