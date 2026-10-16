import Link from "next/link";
import { SectionHeading } from "@/components/public/SectionHeading";
import { experienceDate, experienceKind, FallbackCover } from "@/components/public/experiences/ExperienceCard";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { mediaImage } from "@/lib/content/media";
import type { PublishedItem } from "@/lib/content/public";

type CardDict = Pick<Dictionary["experiences"], "kinds" | "detail">;

const STRETCHED =
  "rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

/**
 * Experiências na Home (DESIGN-D): a mais recente em destaque, com foto grande, e as seguintes em lista
 * com miniatura. Substitui a grade de cartões iguais; os dados são os mesmos (publicados pelo Portal).
 */
export function HomeExperiences({
  locale,
  dict,
  items,
  covers,
  cardDict,
}: {
  locale: Locale;
  dict: Dictionary["home"]["experiences"];
  items: PublishedItem[];
  covers: Map<string, string>;
  cardDict: CardDict;
}) {
  if (items.length === 0) return null;
  const [featured, ...rest] = items;
  const meta = (e: PublishedItem) => {
    const date = experienceDate(e);
    return (
      <>
        {cardDict.kinds[experienceKind(e.title)]} · <time dateTime={date}>{formatDate(locale, new Date(date), { dateStyle: "medium" })}</time>
      </>
    );
  };
  const href = (e: PublishedItem) => localizePath(locale, `/experiencias/${e.slug}`);
  const cover = covers.get(featured.id);

  return (
    <section className="section-regular bg-canvas" data-published="live">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.publishedTitle} link={{ href: localizePath(locale, "/experiencias"), label: dict.link }} />

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <article data-reveal className="media-hover relative flex flex-col gap-4 lg:col-span-7">
            <div className="zoom-media overflow-hidden rounded-2xl">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
                <img {...mediaImage(cover, "feature")} alt={featured.cover_alt} loading="lazy" className="aspect-[3/2] w-full object-cover" />
              ) : (
                <FallbackCover label={cardDict.kinds[experienceKind(featured.title)]} />
              )}
            </div>
            <p className="meta text-link">{meta(featured)}</p>
            <h3 className="t-subsection f-display font-black">
              <Link href={href(featured)} className={STRETCHED}>
                {featured.title}
              </Link>
            </h3>
            {featured.event_place && <p className="meta">{featured.event_place}</p>}
            <p className="line-clamp-3 max-w-[65ch] text-fg-muted">{featured.summary}</p>
          </article>

          {rest.length > 0 && (
            <ul className="flex flex-col divide-y divide-line border-y border-line lg:col-span-5" data-reveal-group>
              {rest.map((e) => {
                const c = covers.get(e.id);
                return (
                  <li key={e.id} className="relative flex gap-4 py-5">
                    <div className="w-28 shrink-0 overflow-hidden rounded-xl">
                      {c ? (
                        // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
                        <img {...mediaImage(c, "mini")} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      ) : (
                        <div aria-hidden="true" className="aspect-[4/3] w-full bg-action/15" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="meta">{meta(e)}</p>
                      <h3 className="font-bold leading-snug">
                        <Link href={href(e)} className={STRETCHED}>
                          {e.title}
                        </Link>
                      </h3>
                      {e.event_place && <p className="line-clamp-1 text-sm text-fg-muted">{e.event_place}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
