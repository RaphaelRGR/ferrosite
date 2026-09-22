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

/** Tamanho do cartão OG (1200x630, proporção que as redes recortam bem). */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** canonical + hreflang (pt-BR, en, x-default) para um caminho sem prefixo. */
export function localeAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], localizePath(l, path)]));
  return {
    canonical: localizePath(locale, path),
    languages: { ...languages, "x-default": localizePath("pt", path) },
  };
}

/**
 * Metadata de uma página pública: título/descrição do catálogo, alternates e OG
 * localizado. Sem `image`, vale o cartão gerado em `opengraph-image.tsx`; com
 * `image`, a foto da própria publicação (capa) representa a página ao ser
 * compartilhada. A URL relativa é resolvida contra `metadataBase` (SITE_URL).
 */
export function publicPageMetadata(
  locale: Locale,
  path: string,
  page: { title: string; description?: string; image?: { url: string; alt: string } | null },
): Metadata {
  const dict = getDictionary(locale);
  // Com capa própria, a foto representa a página (sem declarar dimensão: quem lê mede a imagem).
  // Sem capa, vale o cartão institucional do locale, que tem exatamente 1200x630.
  const images = page.image
    ? [{ url: page.image.url, alt: page.image.alt || page.title }]
    : [{ url: `/og/${locale}`, alt: dict.site.name, ...OG_SIZE }];
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
      images,
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description ?? dict.site.description, images },
  };
}
