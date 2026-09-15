import type { MetadataRoute } from "next";
import { LOCALE_TAGS, LOCALES, localizePath } from "@/i18n/config";
import { SITE_URL } from "@/i18n/metadata";

// Rotas públicas atuais; hubs/detalhes entram em PUBLIC-002 com dados reais.
const PUBLIC_PATHS = ["/", "/curso", "/sobre", "/visitas", "/eventos", "/noticias", "/simuladores"];

/** Sitemap por locale com alternates hreflang (24). */
export default function sitemap(): MetadataRoute.Sitemap {
  const abs = (path: string) => new URL(path, SITE_URL).toString();
  return PUBLIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: abs(localizePath(locale, path)),
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], abs(localizePath(l, path))])),
      },
    })),
  );
}
