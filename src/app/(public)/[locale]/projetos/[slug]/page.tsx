import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { PendingPage } from "@/components/editorial/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { FEATURED_PROJECTS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, LOCALES, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { PublishedGallery } from "@/components/public/PublishedGallery";
import { categoryKey, ProjectPoster } from "@/components/public/projects/ProjectCover";
import { categoryLabel, ProjectTile } from "@/components/public/projects/ProjectGroups";
import { projectText } from "@/components/public/projects/ProjectCards";
import { renderMarkdown } from "@/lib/content/markdown";
import { mediaImage, shareImageUrl } from "@/lib/content/media";
import { getPublicProject, listPublicProjects, publicCoverIds, publicProjectGallery } from "@/lib/content/public";
import { isSectionVisible } from "@/content/quarantine";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => FEATURED_PROJECTS.map((p) => ({ locale, slug: p.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projetos/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const real = await getPublicProject(slug);
  const realText = real ? projectText(real, l) : null;
  const image = real?.cover_file_id ? { url: shareImageUrl(real.cover_file_id), alt: realText?.name ?? "" } : null;
  if (realText) return publicPageMetadata(l, `/projetos/${slug}`, { title: realText.name, description: realText.summary, image });
  const project = FEATURED_PROJECTS.find((p) => p.id === slug);
  return project ? publicPageMetadata(l, `/projetos/${slug}`, { title: project.title, description: project.description }) : {};
}

/**
 * Detalhe público de projeto. Só existe para slugs citados no protótipo; o
 * conteúdo real (problema, equipe, marcos, galeria) vem da projeção aprovada
 * (PUB-001). Até lá: capa neutra, resumo em quarentena e aviso explícito.
 */
export default async function ProjetoPage({ params }: PageProps<"/[locale]/projetos/[slug]">) {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const real = await getPublicProject(slug);
  const realText = real ? projectText(real, l) : null;
  if (real && realText) {
    const [gallery, all] = await Promise.all([publicProjectGallery(slug, l), listPublicProjects()]);
    const description = l === "en" ? real.description_md_en : real.description_md;
    const label = categoryLabel(dict, real.category);
    // outros projetos da mesma categoria (na ordem da coordenação), com texto no idioma
    const siblings = all.filter((p) => p.slug !== slug && categoryKey(p.category) === categoryKey(real.category) && projectText(p, l)).slice(0, 3);
    const siblingCovers = await publicCoverIds(siblings.map((p) => ({ id: p.id, cover_file_id: p.cover_file_id })));
    return (
      <article data-published="live">
        {/* Cabeçalho no cartaz da categoria (identidade sem depender de foto); a foto, se houver, vem logo abaixo. */}
        <header className="bg-surface pt-6 sm:pt-10">
          <div className="mx-auto max-w-7xl sm:px-6">
            <ProjectPoster category={real.category} className="flex flex-col justify-end gap-4 px-4 py-10 sm:rounded-2xl sm:p-10 lg:p-14">
              <Link href={localizePath(l, "/projetos")} className="inline-flex w-fit items-center gap-1 rounded text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
                <span aria-hidden="true">←</span> {dict.projectsHub.all}
              </Link>
              <p className="text-sm font-bold">{label}</p>
              <h1 className="t-title max-w-4xl font-black">{realText.name}</h1>
              <p className="t-lead max-w-[60ch]">{realText.summary}</p>
            </ProjectPoster>
          </div>
        </header>
        {gallery[0] && (
          <figure className="mx-auto mt-8 max-w-7xl sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia) */}
            <img {...mediaImage(gallery[0].fileId, "wide")} alt={gallery[0].alt} className="aspect-[4/3] w-full object-cover sm:aspect-[21/9] sm:rounded-2xl" />
            {gallery[0].credit && <figcaption className="meta mt-2 px-4 sm:px-0">{`${dict.published.credit}: ${gallery[0].credit}`}</figcaption>}
          </figure>
        )}
        <div className="section-regular mx-auto max-w-7xl px-4 sm:px-6">
          {description && <div className="prose-content max-w-[68ch] text-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(description) }} />}
          <PublishedGallery items={gallery.slice(1)} title={dict.published.gallery} creditLabel={dict.published.credit} labels={dict.published.lightbox} />
        </div>
        {siblings.length > 0 && (
          <section aria-labelledby="mesma-categoria" className="section-regular bg-canvas">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <h2 id="mesma-categoria" className="t-subsection font-black">
                {dict.projectsHub.sameCategory.replace("{category}", label)}
              </h2>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {siblings.map((p) => (
                  <li key={p.id} className="relative">
                    <ProjectTile project={p} text={projectText(p, l)!} coverId={siblingCovers.get(p.id)} locale={l} detailLabel={dict.home.projects.detail} wide={false} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>
    );
  }
  const project = FEATURED_PROJECTS.find((p) => p.id === slug);
  if (!project || !isSectionVisible("projetos.detalhe")) notFound();
  if (l !== "pt") return <PendingPage dict={dict} path={`/projetos/${slug}`} />;

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 section-compact">
        <UnverifiedContent section="projetos.detalhe">
          <div className="rounded-2xl bg-surface p-5 sm:p-8 md:p-12">
            <Badge tone="neutral">{project.meta}</Badge>
            <div className="mt-4">
              <SectionHeading as="h1" eyebrow={dict.pages.projects.title} title={project.title} description={project.description} />
            </div>
            <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-canvas p-6">
              <p className="font-bold">{dict.pending.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{dict.pending.projectDetail}</p>
            </div>
            <div className="mt-8">
              <LinkButton href={localizePath(l, "/projetos")} variant="secondary">
                ← {dict.pages.projects.title}
              </LinkButton>
            </div>
          </div>
        </UnverifiedContent>
      </div>
    </section>
  );
}
