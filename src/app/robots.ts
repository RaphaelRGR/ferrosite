import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    // `/api/midia` fica liberado: é a foto que representa a página quando o link é
    // compartilhado (og:image) e alguns robôs respeitam robots.txt ao buscá-la.
    rules: [{ userAgent: "*", allow: ["/", "/api/midia/"], disallow: ["/portal", "/api", "/design-system", "/pt/previa/", "/en/previa/"] }],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
