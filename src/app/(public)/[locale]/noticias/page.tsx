import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { NEWS } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/noticias";

export async function generateMetadata({ params }: PageProps<"/[locale]/noticias">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.news);
}

/**
 * Hub de notícias (04): lista o staging sob quarentena; sem paginação falsa
 * (só há 3 itens) e sem newsletter até existir provedor/consentimento.
 */
export default async function NoticiasPage({ params }: PageProps<"/[locale]/noticias">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.newsPage.eyebrow} title={dict.newsPage.title} description={dict.newsPage.description} />
        </div>
      </section>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6">
        <UnverifiedContent section="noticias.hub">
          <ul className="grid gap-5 md:grid-cols-3">
            {NEWS.map((n) => (
              <li key={n.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <div aria-hidden="true" className="h-36 bg-gradient-to-br from-surface-2 to-canvas" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">{n.meta}</p>
                  <p className="font-bold leading-snug">{n.title}</p>
                  <p className="text-sm text-fg-muted">{n.description}</p>
                  <Link
                    href={localizePath(l, `/noticias/${n.id}`)}
                    className="mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {dict.newsPage.read} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </UnverifiedContent>
        <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
          <h2 className="font-bold">{dict.newsPage.newsletterTitle}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.newsPage.newsletterPending}</p>
        </section>
      </div>
    </div>
  );
}
