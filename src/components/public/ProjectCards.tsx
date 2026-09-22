import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { localizePath, type Locale } from "@/i18n/config";
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

export function ProjectCards({ projects, covers, locale, dict, detailLabel, columns = 3 }: {
  projects: PublicProject[];
  covers: Map<string, string>;
  locale: Locale;
  dict: Dictionary;
  detailLabel: string;
  columns?: 3 | 4;
}) {
  const items = projects.map((p) => ({ p, t: projectText(p, locale) })).filter((x): x is { p: PublicProject; t: { name: string; summary: string } } => x.t !== null);
  if (items.length === 0) return null;
  return (
    <ul className={`grid gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`} data-published="live" data-reveal-group>
      {items.map(({ p, t }) => (
        <li key={p.id} className="card-lift relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
          {/* Sem capa não há bloco vazio: o cartão fica só com o texto (no celular o placeholder era um retângulo em branco). */}
          {covers.get(p.id) && (
            <div className="zoom-media">
              {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia) */}
              <img src={covers.get(p.id)} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 p-5">
            <Badge tone="neutral" className="self-start">{dict.portal.projectCategory[p.category as keyof Dictionary["portal"]["projectCategory"]]}</Badge>
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
