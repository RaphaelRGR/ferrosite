import Link from "next/link";
import { Locomotive } from "@/components/public/motion/Locomotive";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { mediaImage } from "@/lib/content/media";
import type { PublishedItem } from "@/lib/content/public";

export type ExperienceKind = "visit" | "talk" | "event";

/** Tipo pela forma como a coordenação intitula: "Visita técnica: …", "Palestra …"; o resto é evento. */
export function experienceKind(title: string): ExperienceKind {
  if (/^visita/i.test(title)) return "visit";
  if (/^palestra/i.test(title)) return "talk";
  return "event";
}

/** Data que ordena e agrupa: a do acontecimento; sem ela, a da publicação. */
export function experienceDate(item: Pick<PublishedItem, "event_at" | "published_at">): string {
  return item.event_at ?? item.published_at;
}

/**
 * Capa padrão da marca para experiência sem foto autorizada: trilhos em
 * perspectiva, locomotiva e o tipo do evento, em vez de um bloco vazio.
 * Decorativa (o título do cartão já nomeia a experiência).
 */
export function FallbackCover({ label }: { label: string }) {
  return (
    <div aria-hidden="true" data-fallback-cover className="relative flex aspect-[4/3] w-full items-end overflow-hidden bg-action p-5 text-fg-on-action">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full opacity-30" fill="none" stroke="currentColor">
        {Array.from({ length: 9 }, (_, i) => {
          const t = i / 8;
          const y = 300 - t * t * 190;
          const half = 190 - t * 150;
          return <line key={i} x1={200 - half} y1={y} x2={200 + half} y2={y} strokeWidth={10 - t * 7} strokeLinecap="round" />;
        })}
        <line x1="70" y1="300" x2="185" y2="110" strokeWidth="6" />
        <line x1="330" y1="300" x2="215" y2="110" strokeWidth="6" />
      </svg>
      {/* posição no wrapper: a locomotiva já é `relative` e isso venceria o `absolute` */}
      <span className="absolute right-5 top-5 w-24 text-white/40">
        <Locomotive steam={false} className="w-full" />
      </span>
      <span className="relative text-sm font-bold uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}

/**
 * Cartão de experiência publicada (Home e hub): foto (ou capa padrão), tipo e
 * data numa linha curta, título que leva ao detalhe (link esticado cobre o
 * cartão inteiro), local em caixa normal e resumo com no máximo três linhas.
 */
export function ExperienceCard({
  item,
  coverFileId,
  locale,
  dict,
  tone = "surface",
}: {
  item: PublishedItem;
  coverFileId?: string;
  locale: Locale;
  dict: Pick<Dictionary["experiences"], "kinds" | "detail">;
  tone?: "surface" | "canvas";
}) {
  const kind = dict.kinds[experienceKind(item.title)];
  const date = experienceDate(item);
  return (
    <li className={`card-lift relative flex flex-col overflow-hidden rounded-2xl border border-line ${tone === "canvas" ? "bg-canvas" : "bg-surface"}`}>
      <div className="zoom-media">
        {coverFileId ? (
          // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
          <img {...mediaImage(coverFileId, "card")} alt={item.cover_alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <FallbackCover label={kind} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-link">
          {kind} · <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "medium" })}</time>
        </p>
        <h3 className="font-bold leading-snug">
          <Link
            href={localizePath(locale, `/experiencias/${item.slug}`)}
            className="rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {item.title}
          </Link>
        </h3>
        {item.event_place && (
          <p className="flex items-start gap-1.5 text-sm text-fg-muted">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-4 shrink-0">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="line-clamp-1">{item.event_place}</span>
          </p>
        )}
        <p className="line-clamp-3 text-sm text-fg-muted">{item.summary}</p>
        <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-link">
          {dict.detail} <span>→</span>
        </span>
      </div>
    </li>
  );
}
