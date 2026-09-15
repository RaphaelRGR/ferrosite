import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/portal", "/api", "/design-system"] }],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
