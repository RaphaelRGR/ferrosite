import Link from "next/link";
import { CategoryChip, ProjectCover } from "./ProjectCover";
import { localizePath, type Locale } from "@/i18n/config";
import { mediaImage } from "@/lib/content/media";
import type { Dictionary } from "@/i18n/dictionaries";
import type { PublicProject } from "@/lib/content/public";

/**
 * Cards de projetos públicos (PROJ-001): nome/resumo no idioma (EN só se
 * houver texto EN — sem fallback silencioso), categoria e capa pelo proxy.
 */
export function projectText(p: PublicProject, locale: Locale): { name: string; summary: string } | null {
  if (locale === "en") return p.name_en ? { name: p.name_en, summary: p.summary_en } : null;
  return { name: p.name, summary: p.summary };
}

export function ProjectCards({ projects, covers, locale, dict, detailLabel, columns = 3, tone = "surface" }: {
  projects: PublicProject[];
  covers: Map<string, string>;
  locale: Locale;
  dict: Dictionary;
  detailLabel: string;
  columns?: 3 | 4;
  /** fundo do cartão: contrasta com o da seção onde a grade aparece */
  tone?: "surface" | "canvas";
}) {
  const items = projects.map((p) => ({ p, t: projectText(p, locale) })).filter((x): x is { p: PublicProject; t: { name: string; summary: string } } => x.t !== null);
  if (items.length === 0) return null;
  return (
    <ul className={`grid gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`} data-published="live" data-reveal-group>
      {items.map(({ p, t }) => (
        <li key={p.id} className={`card-lift relative flex flex-col overflow-hidden rounded-2xl border border-line ${tone === "canvas" ? "bg-canvas" : "bg-surface"}`}>
          {/* Foto autorizada quando houver; até lá, capa ilustrada na cor da categoria (nunca bloco vazio). */}
          <div className="zoom-media">
            {covers.get(p.id) ? (
              // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
              <img {...mediaImage(covers.get(p.id)!, "card")} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <ProjectCover category={p.category} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <CategoryChip category={p.category} label={dict.portal.projectCategory[p.category as keyof Dictionary["portal"]["projectCategory"]]} />
            <h3 className="text-lg font-bold">
              {/* Link esticado: título, imagem e cartão inteiro levam ao projeto. */}
              <Link href={localizePath(locale, `/projetos/${p.slug}`)} className="rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {t.name}
              </Link>
            </h3>
            <p className="text-sm text-fg-muted">{t.summary}</p>
            <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-link">
              {detailLabel} <span>→</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
