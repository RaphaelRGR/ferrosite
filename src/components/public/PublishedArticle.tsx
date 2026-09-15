import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { renderMarkdown } from "@/lib/content/markdown";
import type { PublishedItem } from "@/lib/content/public";

/**
 * Artigo publicado pela projeção (PUB-001): título, data, resumo, corpo em
 * Markdown restrito (renderizado e escapado no servidor) e crédito da capa.
 * Sem selo de quarentena: passou por aprovação editorial no Portal.
 */
export function PublishedArticle({
  item,
  locale,
  eyebrow,
  backHref,
  backLabel,
  labels,
  preview,
}: {
  item: PublishedItem;
  locale: Locale;
  eyebrow: string;
  backHref: string;
  backLabel: string;
  labels: Dictionary["published"];
  preview?: boolean;
}) {
  const date = item.type === "event" && item.event_at ? item.event_at : item.published_at;
  return (
    <article className="bg-canvas" data-published={preview ? "preview" : "live"}>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {preview && (
          <p role="status" className="mb-6 rounded-xl border border-warning bg-surface px-4 py-3 text-sm font-bold text-warning">
            {labels.previewNotice}
          </p>
        )}
        <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
            <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "long", ...(item.type === "event" ? { timeStyle: "short" } : {}) })}</time>
            {item.type === "event" && item.event_place && ` · ${item.event_place}`}
          </p>
          <div className="mt-3">
            <SectionHeading as="h1" eyebrow={eyebrow} title={item.title} description={item.summary} />
          </div>
          {item.body_md && <div className="prose-content mt-8 text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_md) }} />}
          {(item.cover_credit || item.cover_alt) && (
            <p className="mt-8 text-xs text-fg-muted">
              {labels.coverPending}
              {item.cover_credit && ` · ${labels.credit}: ${item.cover_credit}`}
            </p>
          )}
          <p className="mt-8 text-xs text-fg-muted">{labels.approvedNote}</p>
          <div className="mt-8">
            <LinkButton href={backHref} variant="secondary">
              ← {backLabel}
            </LinkButton>
          </div>
        </div>
      </div>
    </article>
  );
}
