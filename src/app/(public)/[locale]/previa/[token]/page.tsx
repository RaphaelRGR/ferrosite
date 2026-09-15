import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublishedArticle } from "@/components/public/PublishedArticle";
import { DEFAULT_LOCALE, hasLocale, localizePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import type { PublishedItem } from "@/lib/content/public";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Pré-visualização por token (18): não indexável, sem cache, resolvida no
 * servidor via função restrita ao service role. O token só devolve o próprio
 * item; token curto/inválido ou item arquivado ⇒ 404.
 */
export default async function PreviaPage({ params }: PageProps<"/[locale]/previa/[token]">) {
  const { locale, token } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (!/^[0-9a-f]{24,128}$/.test(token)) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();
  const { data } = await admin.rpc("preview_content", { p_token: token });
  const row = data?.[0];
  if (!row) notFound();
  const item: PublishedItem = {
    id: row.id,
    type: row.type,
    locale: (hasLocale(row.locale) ? row.locale : l) as Locale,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body_md: row.body_md,
    event_at: row.event_at,
    event_place: row.event_place,
    cover_alt: "",
    cover_credit: "",
    published_at: new Date().toISOString(),
  };
  const dict = getDictionary(item.locale);
  const isEvent = item.type === "event";
  return (
    <PublishedArticle
      item={item}
      locale={item.locale}
      eyebrow={isEvent ? dict.events.eyebrow : dict.newsPage.eyebrow}
      backHref={localizePath(item.locale, isEvent ? "/eventos" : "/noticias")}
      backLabel={isEvent ? dict.published.backToEvents : dict.newsPage.back}
      labels={dict.published}
      preview
    />
  );
}
