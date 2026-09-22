import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { PublishedArticle } from "@/components/public/PublishedArticle";
import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { NEWS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, LOCALES, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { mediaUrl } from "@/lib/content/media";
import { getPublished, publicCoverId } from "@/lib/content/public";

// Slugs publicados pelo Portal renderizam sob demanda (ISR); os do staging são pré-renderizados.
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => NEWS.map((n) => ({ locale, id: n.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/noticias/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const published = await getPublished("news", l, id);
  const coverId = published?.cover_file_id ? await publicCoverId(published) : null;
  const image = coverId && published ? { url: mediaUrl(coverId, 1280), alt: published.cover_alt } : null;
  if (published) return publicPageMetadata(l, `/noticias/${id}`, { title: published.title, description: published.summary, image });
  const item = NEWS.find((n) => n.id === id);
  return item ? publicPageMetadata(l, `/noticias/${id}`, { title: item.title, description: item.description }) : {};
}

/** Notícia: publicação aprovada (projeção, sem selo) ou, no PT, item do staging sob quarentena com corpo pendente. */
export default async function NoticiaPage({ params }: PageProps<"/[locale]/noticias/[id]">) {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const published = await getPublished("news", l, id);
  if (published) {
    const coverFileId = await publicCoverId(published);
    return <PublishedArticle item={published} locale={l} eyebrow={dict.newsPage.eyebrow} backHref={localizePath(l, "/noticias")} backLabel={dict.newsPage.back} labels={dict.published} coverFileId={coverFileId} />;
  }
  const item = NEWS.find((n) => n.id === id);
  if (!item) notFound();
  if (l !== "pt") return <PendingPage dict={dict} path={`/noticias/${id}`} />;

  return (
    <article className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <UnverifiedContent section="noticias.detalhe">
          <div className="rounded-[32px] border border-line bg-surface p-5 sm:p-8 md:p-12">
            <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">{item.meta}</p>
            <div className="mt-3">
              <SectionHeading as="h1" eyebrow={dict.newsPage.eyebrow} title={item.title} description={item.description} />
            </div>
            <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-canvas p-6">
              <p className="font-bold">{dict.pending.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{dict.newsPage.pendingBody}</p>
            </div>
            <div className="mt-8">
              <LinkButton href={localizePath(l, "/noticias")} variant="secondary">
                ← {dict.newsPage.back}
              </LinkButton>
            </div>
          </div>
        </UnverifiedContent>
      </div>
    </article>
  );
}
