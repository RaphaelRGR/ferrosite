import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { PendingPage } from "@/components/editorial/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { FEATURED_PROJECTS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { CategoryJumpLinks, ProjectGroups } from "@/components/public/projects/ProjectGroups";
import { listPublicProjects, publicCoverIds } from "@/lib/content/public";

// projetos públicos e capas do Drive: revalida como as demais páginas com conteúdo publicado
export const revalidate = 300;
const PATH = "/projetos";

export async function generateMetadata({ params }: PageProps<"/[locale]/projetos">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.projects);
}

/**
 * Hub de projetos (DESIGN-D): os projetos permanentes do curso agrupados por categoria, na ordem da
 * coordenação, com atalhos por âncora (sem JS). Os citados só no protótipo seguem em quarentena.
 */
export default async function ProjetosPage({ params }: PageProps<"/[locale]/projetos">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const projects = await listPublicProjects();
  const visible = l === "en" ? projects.filter((p) => p.name_en) : projects;
  if (l !== "pt" && visible.length === 0) return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);
  const covers = await publicCoverIds(visible.map((p) => ({ id: p.id, cover_file_id: p.cover_file_id })));
  const realSlugs = new Set(projects.map((p) => p.slug));

  return (
    <>
      <section className="section-compact bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6">
          <SectionHeading as="h1" title={dict.pages.projects.title} description={dict.pages.projects.description} />
          {visible.length > 0 && <CategoryJumpLinks projects={visible} dict={dict} locale={l} />}
        </div>
      </section>
      <section className="section-regular bg-canvas">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {visible.length > 0 && <ProjectGroups projects={visible} covers={covers} locale={l} dict={dict} detailLabel={dict.home.projects.detail} />}
          {l === "pt" && FEATURED_PROJECTS.some((p) => !realSlugs.has(p.id)) && (
            <UnverifiedContent section="projetos.hub">
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURED_PROJECTS.filter((p) => !realSlugs.has(p.id)).map((p) => (
                  <li key={p.id} className="flex flex-col gap-2 rounded-2xl bg-surface p-5">
                    <Badge tone="neutral">{p.meta}</Badge>
                    <p className="text-lg font-bold">{p.title}</p>
                    <p className="text-sm text-fg-muted">{p.description}</p>
                    <Link
                      href={localizePath(l, `/projetos/${p.id}`)}
                      className="mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {dict.home.projects.detail} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </UnverifiedContent>
          )}
        </div>
      </section>
    </>
  );
}
