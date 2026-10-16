import type { Locale } from "@/i18n/config";
import type { PublicProject } from "@/lib/content/public";

/**
 * Texto público do projeto no idioma (PROJ-001): EN só se houver texto EN, sem fallback silencioso.
 * A apresentação fica em ProjectShowcase (Home) e ProjectGroups (hub), DESIGN-D.
 */
export function projectText(p: PublicProject, locale: Locale): { name: string; summary: string } | null {
  if (locale === "en") return p.name_en ? { name: p.name_en, summary: p.summary_en } : null;
  return { name: p.name, summary: p.summary };
}
