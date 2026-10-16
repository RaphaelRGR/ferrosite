import Link from "next/link";
import { CategoryChip, ProjectPoster, categoryKey } from "./ProjectCover";
import { projectText } from "./ProjectCards";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { mediaImage } from "@/lib/content/media";
import { groupByCategory } from "@/lib/content/project-groups";
import type { PublicProject } from "@/lib/content/public";

type Text = { name: string; summary: string };

const STRETCHED =
  "rounded after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

/** Rótulo da categoria no idioma (as mesmas chaves do Portal). */
export function categoryLabel(dict: Dictionary, category: string): string {
  return dict.portal.projectCategory[categoryKey(category) as keyof Dictionary["portal"]["projectCategory"]] ?? category;
}

/** Atalhos para cada grupo (âncoras, sem JS): selo da categoria + quantidade. */
export function CategoryJumpLinks({ projects, dict, locale }: { projects: PublicProject[]; dict: Dictionary; locale: Locale }) {
  const groups = groupByCategory(projects.filter((p) => projectText(p, locale)));
  return (
    <nav aria-label={dict.projectsHub.categories} className="flex flex-wrap gap-2">
      {groups.map((g) => (
        <a key={g.category} href={`#cat-${categoryKey(g.category)}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <CategoryChip category={g.category} label={`${categoryLabel(dict, g.category)} · ${g.items.length}`} />
        </a>
      ))}
    </nav>
  );
}

/**
 * Projetos por categoria (DESIGN-D). Grupo de um projeto vira faixa larga; grupos maiores, colunas:
 * a variação de tamanho vem dos dados, não de um mosaico arbitrário. Com foto autorizada, a foto;
 * sem foto, o cartaz da categoria com o nome grande (nunca bloco vazio).
 */
export function ProjectGroups({ projects, covers, locale, dict, detailLabel, headingLevel = "h2" }: {
  projects: PublicProject[];
  covers: Map<string, string>;
  locale: Locale;
  dict: Dictionary;
  detailLabel: string;
  headingLevel?: "h2" | "h3";
}) {
  const withText = projects.map((p) => ({ p, t: projectText(p, locale) })).filter((x): x is { p: PublicProject; t: Text } => x.t !== null);
  const groups = groupByCategory(withText.map((x) => ({ ...x, category: x.p.category })));
  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-16" data-published="live">
      {groups.map((g) => {
        const key = categoryKey(g.category);
        const single = g.items.length === 1;
        return (
          <section key={g.category} id={`cat-${key}`} aria-labelledby={`cat-${key}-h`} className="scroll-mt-28">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <Heading id={`cat-${key}-h`} className="t-subsection font-black">
                {categoryLabel(dict, g.category)}
              </Heading>
              <span className="meta">{single ? dict.projectsHub.countOne : dict.projectsHub.count.replace("{count}", String(g.items.length))}</span>
            </div>
            <ul className={`mt-6 grid gap-5 ${single ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`} data-reveal-group>
              {g.items.map(({ p, t }) => (
                <li key={p.id} className="relative">
                  <ProjectTile project={p} text={t} coverId={covers.get(p.id)} locale={locale} detailLabel={detailLabel} wide={single} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Um projeto: foto + texto, ou o cartaz da categoria (sem foto). Também usado em "outros projetos". */
export function ProjectTile({ project: p, text: t, coverId, locale, detailLabel, wide }: { project: PublicProject; text: Text; coverId?: string; locale: Locale; detailLabel: string; wide: boolean }) {
  const href = localizePath(locale, `/projetos/${p.slug}`);
  if (coverId) {
    return (
      <article className={`media-hover relative flex h-full gap-4 ${wide ? "flex-col md:grid md:grid-cols-2 md:items-center md:gap-10" : "flex-col"}`}>
        <div className="zoom-media overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia) */}
          <img {...mediaImage(coverId, wide ? "feature" : "card")} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="f-display text-2xl font-black">
            <Link href={href} className={`${STRETCHED} hover:text-link`}>
              {t.name}
            </Link>
          </h3>
          <p className="text-fg-muted">{t.summary}</p>
          <span aria-hidden="true" className="font-bold text-link">
            {detailLabel} →
          </span>
        </div>
      </article>
    );
  }
  return (
    <ProjectPoster category={p.category} className={`flex h-full flex-col justify-end gap-4 rounded-2xl p-6 ${wide ? "min-h-56 sm:p-10" : "min-h-72"}`}>
      <h3 className={`f-display font-black ${wide ? "t-section" : "text-2xl"}`}>
        <Link href={href} className={`${STRETCHED} underline-offset-4 hover:underline focus-visible:ring-current`}>
          {t.name}
        </Link>
      </h3>
      <p className={wide ? "max-w-[60ch] text-lg" : "line-clamp-4"}>{t.summary}</p>
      <span aria-hidden="true" className="font-bold">
        {detailLabel} →
      </span>
    </ProjectPoster>
  );
}
