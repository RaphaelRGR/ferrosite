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

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => FEATURED_PROJECTS.map((p) => ({ locale, slug: p.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projetos/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
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
  const project = FEATURED_PROJECTS.find((p) => p.id === slug);
  if (!project) notFound();
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage locale={l} dict={dict} path={`/projetos/${slug}`} />;

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <UnverifiedContent section="projetos.detalhe">
          <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12">
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
