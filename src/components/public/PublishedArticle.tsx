import Link from "next/link";
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
 * DESIGN-D: cabeçalho editorial, capa grande sob o título, texto em medida de leitura, galeria larga.
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
    <article data-published={preview ? "preview" : "live"}>
      <header className="section-compact bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6">
          {preview && (
            <p role="status" className="rounded-xl border border-warning bg-surface px-4 py-3 text-sm font-bold text-warning">
              {labels.previewNotice}
            </p>
          )}
          <Link href={backHref} className="meta inline-flex w-fit items-center gap-1 rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <span aria-hidden="true">←</span> {backLabel}
          </Link>
          <p className="eyebrow">
            <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-action" />
            {eyebrow}
          </p>
          <h1 className="t-title max-w-5xl font-black">{item.title}</h1>
          <p className="meta">
            <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "long", ...(item.type === "event" ? { timeStyle: "short" } : {}) })}</time>
            {dated && item.event_place && ` · ${item.event_place}`}
          </p>
          {item.summary && <p className="t-lead max-w-[60ch] text-fg-muted">{item.summary}</p>}
        </div>
      </header>
      {/* Capa grande logo abaixo do título; no celular vai de ponta a ponta. */}
      {coverFileId && (
        <figure className="mx-auto max-w-7xl sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia), sem otimização externa */}
          <img {...mediaImage(coverFileId, "wide")} alt={item.cover_alt} className="aspect-[4/3] w-full object-cover sm:aspect-[16/9] sm:rounded-2xl" fetchPriority="high" />
          {item.cover_credit && <figcaption className="meta mt-2 px-4 sm:px-0">{`${labels.credit}: ${item.cover_credit}`}</figcaption>}
        </figure>
      )}
      <div className="section-regular mx-auto max-w-7xl px-4 sm:px-6">
        {item.body_md && <div className="prose-content max-w-[68ch] text-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.body_md) }} />}
        {!coverFileId && (item.cover_credit || item.cover_alt) && (
          <p className="mt-8 text-xs text-fg-muted">
            {labels.coverPending}
            {item.cover_credit && ` · ${labels.credit}: ${item.cover_credit}`}
          </p>
        )}
        <PublishedGallery items={gallery} title={labels.gallery} creditLabel={labels.credit} labels={labels.lightbox} />
        <p className="mt-10 text-xs text-fg-muted">{labels.approvedNote}</p>
        <div className="mt-6">
          <LinkButton href={backHref} variant="secondary">
            ← {backLabel}
          </LinkButton>
        </div>
      </div>
    </article>
  );
}
