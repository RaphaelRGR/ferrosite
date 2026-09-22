import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { FEATURED_PROJECTS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { ProjectCards } from "@/components/public/ProjectCards";
import { listPublicProjects, publicCoverUrls } from "@/lib/content/public";

const PATH = "/projetos";

export async function generateMetadata({ params }: PageProps<"/[locale]/projetos">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.projects);
}

/**
 * Hub de projetos (04, guia §8). Até PUBLIC-002/PUB-001 trazerem a projeção
 * pública aprovada, lista apenas os projetos citados no protótipo, sob quarentena.
 */
export default async function ProjetosPage({ params }: PageProps<"/[locale]/projetos">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const projects = await listPublicProjects();
  const visible = l === "en" ? projects.filter((p) => p.name_en) : projects;
  if (l !== "pt" && visible.length === 0) return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);
  const covers = await publicCoverUrls(visible.map((p) => ({ id: p.id, cover_file_id: p.cover_file_id })));
  const realSlugs = new Set(projects.map((p) => p.slug));

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading as="h1" eyebrow={dict.home.projects.eyebrow} title={dict.pages.projects.title} description={dict.pages.projects.description} />
        {visible.length > 0 && (
          <div className="mt-10">
            <ProjectCards projects={visible} covers={covers} locale={l} dict={dict} detailLabel={dict.home.projects.detail} />
          </div>
        )}
        {l === "pt" && FEATURED_PROJECTS.some((p) => !realSlugs.has(p.id)) && (
        <UnverifiedContent section="projetos.hub">
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_PROJECTS.filter((p) => !realSlugs.has(p.id)).map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <div aria-hidden="true" className="h-36 bg-gradient-to-br from-surface-2 to-canvas" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Badge tone="neutral">{p.meta}</Badge>
                  <p className="text-lg font-bold">{p.title}</p>
                  <p className="text-sm text-fg-muted">{p.description}</p>
                  <Link
                    href={localizePath(l, `/projetos/${p.id}`)}
                    className="mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {dict.home.projects.detail} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </UnverifiedContent>
        )}
      </div>
    </section>
  );
}
