import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { mediaImage } from "@/lib/content/media";
import { renderMarkdown } from "@/lib/content/markdown";
import type { PublicGalleryItem, PublishedItem } from "@/lib/content/public";
import { PublishedGallery } from "./PublishedGallery";

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
  coverFileId = null,
  gallery = [],
}: {
  item: PublishedItem;
  locale: Locale;
  eyebrow: string;
  backHref: string;
  backLabel: string;
  labels: Dictionary["published"];
  preview?: boolean;
  /** Capa servida pelo proxy público (DRIVE-001); `null` mantém só o crédito. */
  coverFileId?: string | null;
  /** Galeria já filtrada pelo banco (DRIVE-004). */
  gallery?: PublicGalleryItem[];
}) {
  // Eventos e experiências são datados pelo acontecimento (a data de publicação fica no rodapé do artigo).
  const dated = (item.type === "event" || item.type === "experience") && item.event_at;
  const date = dated ? item.event_at! : item.published_at;
  return (
    <article className="bg-canvas" data-published={preview ? "preview" : "live"}>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {preview && (
          <p role="status" className="mb-6 rounded-xl border border-warning bg-surface px-4 py-3 text-sm font-bold text-warning">
            {labels.previewNotice}
          </p>
        )}
        <div className="rounded-[32px] border border-line bg-surface p-5 sm:p-8 md:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
            <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "long", ...(item.type === "event" ? { timeStyle: "short" } : {}) })}</time>
            {dated && item.event_place && ` · ${item.event_place}`}
          </p>
          <div className="mt-3">
            <SectionHeading as="h1" eyebrow={eyebrow} title={item.title} description={item.summary} />
          </div>
          {/* Capa logo abaixo do título (no celular a foto era a última coisa a aparecer). */}
          {coverFileId && (
            <figure className="mt-8">
              {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia), sem otimização externa */}
              <img {...mediaImage(coverFileId, "article")} alt={item.cover_alt} className="w-full rounded-2xl border border-line" fetchPriority="high" />
              {item.cover_credit && <figcaption className="mt-2 text-xs text-fg-muted">{`${labels.credit}: ${item.cover_credit}`}</figcaption>}
            </figure>
          )}
          {item.body_md && <div className="prose-content mt-8 text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_md) }} />}
          {!coverFileId && (item.cover_credit || item.cover_alt) && (
            <p className="mt-8 text-xs text-fg-muted">
              {labels.coverPending}
              {item.cover_credit && ` · ${labels.credit}: ${item.cover_credit}`}
            </p>
          )}
          <PublishedGallery items={gallery} title={labels.gallery} creditLabel={labels.credit} labels={labels.lightbox} />
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
