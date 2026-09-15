import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { NEWS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { publicPageMetadata } from "@/i18n/metadata";
import { listPublished } from "@/lib/content/public";

const PATH = "/noticias";
// Projeção pública (PUB-001): ISR + revalidatePath ao publicar/despublicar.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]/noticias">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.news);
}

/**
 * Hub de notícias (04/18): primeiro o que o Portal publicou (projeção aprovada,
 * sem selo), depois o staging do protótipo sob quarentena até ser substituído.
 * EN só mostra publicações EN — nunca PT como fallback (24).
 */
export default async function NoticiasPage({ params }: PageProps<"/[locale]/noticias">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const published = await listPublished("news", l);
  if (l !== "pt" && published.length === 0) return <PendingPage dict={dict} path={PATH} />;
  const linkClass = "mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.newsPage.eyebrow} title={dict.newsPage.title} description={dict.newsPage.description} />
        </div>
      </section>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6">
        {published.length > 0 && (
          <section aria-labelledby="noticias-publicadas">
            <h2 id="noticias-publicadas" className="text-xs font-bold uppercase tracking-[0.2em] text-action">
              {dict.published.publishedSection}
            </h2>
            <ul className="mt-4 grid gap-5 md:grid-cols-3" data-published="live">
              {published.map((n) => (
                <li key={n.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                  <div aria-hidden="true" className="h-36 bg-gradient-to-br from-surface-2 to-canvas" />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
                      <time dateTime={n.published_at}>{formatDate(l, new Date(n.published_at), { dateStyle: "medium" })}</time>
                    </p>
                    <p className="font-bold leading-snug">{n.title}</p>
                    <p className="text-sm text-fg-muted">{n.summary}</p>
                    <Link href={localizePath(l, `/noticias/${n.slug}`)} className={linkClass}>
                      {dict.newsPage.read} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {l === "pt" && (
          <UnverifiedContent section="noticias.hub">
            <section aria-labelledby="noticias-staging">
              {published.length > 0 && (
                <h2 id="noticias-staging" className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                  {dict.published.stagingSection}
                </h2>
              )}
              <ul className="grid gap-5 md:grid-cols-3">
                {NEWS.map((n) => (
                  <li key={n.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                    <div aria-hidden="true" className="h-36 bg-gradient-to-br from-surface-2 to-canvas" />
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">{n.meta}</p>
                      <p className="font-bold leading-snug">{n.title}</p>
                      <p className="text-sm text-fg-muted">{n.description}</p>
                      <Link href={localizePath(l, `/noticias/${n.id}`)} className={linkClass}>
                        {dict.newsPage.read} <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </UnverifiedContent>
        )}
        <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
          <h2 className="font-bold">{dict.newsPage.newsletterTitle}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.newsPage.newsletterPending}</p>
        </section>
      </div>
    </div>
  );
}
