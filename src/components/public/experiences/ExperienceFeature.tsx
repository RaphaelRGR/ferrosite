import Link from "next/link";
import { experienceDate, experienceKind, FallbackCover } from "./ExperienceCard";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { mediaImage } from "@/lib/content/media";
import type { PublishedItem } from "@/lib/content/public";

/**
 * Experiência em destaque (DESIGN-D): foto grande, tipo · data, título, local e resumo. Usada na Home
 * (a mais recente) e no topo de cada ano em /experiencias. O título cobre o bloco inteiro como link.
 */
export function ExperienceFeature({
  item,
  coverFileId,
  locale,
  dict,
  className = "",
}: {
  item: PublishedItem;
  coverFileId?: string;
  locale: Locale;
  dict: Pick<Dictionary["experiences"], "kinds">;
  className?: string;
}) {
  const kind = dict.kinds[experienceKind(item.title)];
  const date = experienceDate(item);
  return (
    <article data-reveal className={`media-hover relative flex flex-col gap-4 ${className}`}>
      <div className="wipe-in zoom-media overflow-hidden rounded-2xl">
        {coverFileId ? (
          // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
          <img {...mediaImage(coverFileId, "feature")} alt={item.cover_alt} loading="lazy" className="aspect-[3/2] w-full object-cover" />
        ) : (
          <FallbackCover label={kind} />
        )}
      </div>
      <p className="meta text-link">
        {kind} · <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "medium" })}</time>
      </p>
      <h3 className="t-subsection f-display font-black">
        <Link
          href={localizePath(locale, `/experiencias/${item.slug}`)}
          className="rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {item.title}
        </Link>
      </h3>
      {item.event_place && <p className="meta">{item.event_place}</p>}
      <p className="line-clamp-3 max-w-[65ch] text-fg-muted">{item.summary}</p>
    </article>
  );
}
