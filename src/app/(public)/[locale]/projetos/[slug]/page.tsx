import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { FEATURED_PROJECTS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, LOCALES, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { PublishedGallery } from "@/components/public/PublishedGallery";
import { projectText } from "@/components/public/ProjectCards";
import { renderMarkdown } from "@/lib/content/markdown";
import { mediaImage, mediaUrl } from "@/lib/content/media";
import { getPublicProject, publicProjectGallery } from "@/lib/content/public";
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
  const image = real?.cover_file_id ? { url: mediaUrl(real.cover_file_id, 1280), alt: realText?.name ?? "" } : null;
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
    const gallery = await publicProjectGallery(slug, l);
    const description = l === "en" ? real.description_md_en : real.description_md;
    return (
      <section className="bg-canvas">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <div className="rounded-[32px] border border-line bg-surface p-5 sm:p-8 md:p-12" data-published="live">
            <Badge tone="neutral" className="self-start">{dict.portal.projectCategory[real.category as keyof typeof dict.portal.projectCategory]}</Badge>
            <div className="mt-4">
              <SectionHeading as="h1" eyebrow={dict.pages.projects.title} title={realText.name} description={realText.summary} />
            </div>
            {gallery[0] && (
              <figure className="mt-8">
                {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia) */}
                <img {...mediaImage(gallery[0].fileId, "article")} alt={gallery[0].alt} className="w-full rounded-2xl border border-line" />
                {gallery[0].credit && <figcaption className="mt-2 text-xs text-fg-muted">{`${dict.published.credit}: ${gallery[0].credit}`}</figcaption>}
              </figure>
            )}
            {description && <div className="prose-content mt-8 text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(description) }} />}
            <PublishedGallery items={gallery.slice(1)} title={dict.published.gallery} creditLabel={dict.published.credit} labels={dict.published.lightbox} />
            <div className="mt-8">
              <LinkButton href={localizePath(l, "/projetos")} variant="secondary">
                ← {dict.pages.projects.title}
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    );
  }
  const project = FEATURED_PROJECTS.find((p) => p.id === slug);
  if (!project || !isSectionVisible("projetos.detalhe")) notFound();
  if (l !== "pt") return <PendingPage dict={dict} path={`/projetos/${slug}`} />;

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <UnverifiedContent section="projetos.detalhe">
          <div className="rounded-[32px] border border-line bg-surface p-5 sm:p-8 md:p-12">
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
