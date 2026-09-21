import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublishedArticle } from "@/components/public/PublishedArticle";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { getPublished, publicCoverUrl } from "@/lib/content/public";

export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/eventos/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const item = await getPublished("event", l, slug);
  return item ? publicPageMetadata(l, `/eventos/${slug}`, { title: item.title, description: item.summary }) : {};
}

/** Evento publicado pela projeção (PUB-001); inexistente/despublicado ⇒ 404. */
export default async function EventoPage({ params }: PageProps<"/[locale]/eventos/[slug]">) {
  const { locale, slug } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const item = await getPublished("event", l, slug);
  if (!item) notFound();
  const dict = getDictionary(l);
  const coverUrl = await publicCoverUrl(item);
  return <PublishedArticle item={item} locale={l} eyebrow={dict.events.eyebrow} backHref={localizePath(l, "/eventos")} backLabel={dict.published.backToEvents} labels={dict.published} coverUrl={coverUrl} />;
}
