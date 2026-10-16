import Link from "next/link";
import { CategoryChip, ProjectCover, ProjectPoster } from "./ProjectCover";
import { projectText } from "./ProjectCards";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { mediaImage } from "@/lib/content/media";
import type { PublicProject } from "@/lib/content/public";

const STRETCHED =
  "rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
// Sobre a cor da categoria o texto fica na cor do par AA; o hover sublinha em vez de trocar a cor.
const POSTER_LINK =
  "rounded underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current";

/**
 * Projeto em destaque + os seguintes em lista (DESIGN-D). O destaque é o primeiro na ordem da
 * coordenação (`listPublicProjects`). Foto autorizada quando houver; senão a capa ilustrada da
 * categoria. Nome e resumo no idioma (EN só com texto EN, sem fallback).
 */
export function ProjectShowcase({ projects, covers, locale, dict, detailLabel, limit = 4 }: {
  projects: PublicProject[];
  covers: Map<string, string>;
  locale: Locale;
  dict: Dictionary;
  detailLabel: string;
  limit?: number;
}) {
  const items = projects
    .map((p) => ({ p, t: projectText(p, locale) }))
    .filter((x): x is { p: PublicProject; t: { name: string; summary: string } } => x.t !== null)
    .slice(0, limit);
  if (items.length === 0) return null;
  const [first, ...rest] = items;
  const label = (p: PublicProject) => dict.portal.projectCategory[p.category as keyof Dictionary["portal"]["projectCategory"]];
  const href = (p: PublicProject) => localizePath(locale, `/projetos/${p.slug}`);
  const cover = (p: PublicProject, aspect: string, preset: "feature" | "mini") => {
    const id = covers.get(p.id);
    return id ? (
      // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
      <img {...mediaImage(id, preset)} alt="" loading="lazy" className={`${aspect} w-full object-cover`} />
    ) : (
      <ProjectCover category={p.category} aspect={aspect} />
    );
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12" data-published="live">
      {covers.get(first.p.id) ? (
        <article data-reveal className="media-hover relative flex flex-col gap-4 lg:col-span-7">
          <div className="zoom-media overflow-hidden rounded-2xl">{cover(first.p, "aspect-[16/10]", "feature")}</div>
          <CategoryChip category={first.p.category} label={label(first.p)} />
          <h3 className="t-subsection f-display font-black">
            <Link href={href(first.p)} className={STRETCHED}>
              {first.t.name}
            </Link>
          </h3>
          <p className="max-w-[65ch] text-fg-muted">{first.t.summary}</p>
          <span aria-hidden="true" className="inline-flex items-center gap-1 font-bold text-link">
            {detailLabel} <span>→</span>
          </span>
        </article>
      ) : (
        // Sem foto: cartaz na cor da categoria com o nome grande (pares de cor AA em project-categories.css).
        <article data-reveal className="relative lg:col-span-7">
          <ProjectPoster category={first.p.category} className="flex h-full min-h-80 flex-col justify-end gap-4 rounded-2xl p-6 sm:p-10">
            <h3 className="t-section f-display font-black">
              <Link href={href(first.p)} className={POSTER_LINK}>
                {first.t.name}
              </Link>
            </h3>
            <p className="max-w-[55ch] text-lg">{first.t.summary}</p>
            <span aria-hidden="true" className="inline-flex items-center gap-1 font-bold">
              {label(first.p)} · {detailLabel} <span>→</span>
            </span>
          </ProjectPoster>
        </article>
      )}

      {rest.length > 0 && (
        <ul className="flex flex-col divide-y divide-line border-y border-line lg:col-span-5" data-reveal-group>
          {rest.map(({ p, t }) => (
            <li key={p.id} className="media-hover relative flex gap-4 py-5">
              <div className="zoom-media w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">{cover(p, "aspect-square", "mini")}</div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <CategoryChip category={p.category} label={label(p)} />
                <h3 className="font-bold leading-snug">
                  <Link href={href(p)} className={STRETCHED}>
                    {t.name}
                  </Link>
                </h3>
                <p className="line-clamp-2 text-sm text-fg-muted">{t.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
