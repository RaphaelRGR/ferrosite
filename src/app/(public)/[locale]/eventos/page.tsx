import type { Metadata } from "next";
import Link from "next/link";
import { PendingPage } from "@/components/editorial/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { publicPageMetadata } from "@/i18n/metadata";
import { listPublished, type PublishedItem } from "@/lib/content/public";

const PATH = "/eventos";
export const revalidate = 300;

/** Evento já ocorreu (referência: instante da renderização, fora do JSX). */
function isPast(e: PublishedItem, now = new Date()): boolean {
  return !!e.event_at && new Date(e.event_at).getTime() < now.getTime();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/eventos">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.events);
}

/**
 * Agenda (04/18): só eventos publicados pelo Portal (data, local e responsável
 * validados na aprovação). Sem publicação, a agenda continua vazia e honesta —
 * os eventos do protótipo permanecem só no inventário.
 */
export default async function EventosPage({ params }: PageProps<"/[locale]/eventos">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const events = await listPublished("event", l);
  if (l !== "pt" && events.length === 0) return <PendingPage dict={dict} path={PATH} />;
  const upcoming = events.filter((e) => !isPast(e));
  const past = events.filter((e) => isPast(e)).reverse();

  const list = (items: PublishedItem[]) => (
    <ol className="border-l-2 border-line pl-5">
      {items.map((e) => (
        <li key={e.id} className="relative pb-6 last:pb-0">
          <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface bg-action" />
          <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
            {e.event_at && <time dateTime={e.event_at}>{formatDate(l, new Date(e.event_at), { dateStyle: "medium", timeStyle: "short" })}</time>}
            {e.event_place && ` · ${e.event_place}`}
          </p>
          <p className="mt-1 font-bold">{e.title}</p>
          <p className="text-sm text-fg-muted">{e.summary}</p>
          <Link href={localizePath(l, `/eventos/${e.slug}`)} className="mt-2 inline-flex items-center gap-1 rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {dict.published.readEvent} <span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.events.eyebrow} title={dict.events.title} description={dict.events.description} />
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {events.length === 0 ? (
          <EmptyState
            title={dict.events.emptyTitle}
            description={dict.events.emptyDescription}
            action={
              <LinkButton href={localizePath(l, "/experiencias")} variant="secondary">
                {dict.events.goToExperiences}
              </LinkButton>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-2" data-published="live">
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{dict.published.upcoming}</h2>
              <div className="mt-4">{upcoming.length ? list(upcoming) : <p className="text-sm text-fg-muted">{dict.events.emptyTitle}</p>}</div>
            </section>
            <section className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{dict.published.past}</h2>
              <div className="mt-4">{past.length ? list(past) : <p className="text-sm text-fg-muted">{dict.events.emptyTitle}</p>}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
