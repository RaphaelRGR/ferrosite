import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RailEventForm, RemoveRailEvent } from "@/components/portal/calendar/RailEventForm";
import { Badge } from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { countryName, editableYears, formatEventRange, groupByMonth, monthName } from "@/lib/calendar/rail";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listRailEvents, listRailYears } from "@/lib/portal/queries/calendar";

export const metadata: Metadata = { title: "Calendário ferroviário" };

const TAB = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

/**
 * Calendário ferroviário no Portal (CAL-001): abas do ano atual (no site), do próximo (preparando) e
 * anos anteriores (registro, só leitura). `?ano=` escolhe a aba; `?editar=<id>` abre a edição.
 */
export default async function PortalCalendarPage({ searchParams }: PageProps<"/portal/calendario">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const c = dict.calendar;
  const [current, next] = editableYears();
  const sp = await searchParams;
  const asked = Number(sp.ano);
  const year = Number.isInteger(asked) && asked >= 2026 && asked <= next ? asked : current;
  const editable = year === current || year === next;
  const editId = typeof sp.editar === "string" ? sp.editar : "";
  const [events, years] = await Promise.all([listRailEvents(year), listRailYears()]);
  const past = years.filter((y) => y < current);
  const tabHref = (y: number) => (y === current ? "/portal/calendario" : `/portal/calendario?ano=${y}`);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black">{c.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.intro}</p>
      </div>

      <nav aria-label={c.title} className="flex flex-wrap items-center gap-2">
        {[current, next].map((y) => (
          <Link key={y} href={tabHref(y)} aria-current={y === year ? "page" : undefined} className={`${TAB} ${y === year ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`}>
            {y}
          </Link>
        ))}
        {past.length > 0 && (
          <span className="ml-2 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            {c.pastYears}:
            {past.map((y) => (
              <Link key={y} href={tabHref(y)} aria-current={y === year ? "page" : undefined} className={`${TAB} ${y === year ? "border-action" : "border-line"} bg-surface`}>
                {y}
              </Link>
            ))}
          </span>
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={year === current ? "success" : year === next ? "info" : "neutral"}>{year === current ? c.onSite : year === next ? c.nextYear : c.readOnly}</Badge>
        <span className="text-sm text-fg-muted">{c.count.replace("{count}", String(events.length))}</span>
        {year === current && (
          <a href="/pt/calendario" target="_blank" rel="noopener" className="rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            {c.viewOnSite}
          </a>
        )}
      </div>

      {editable && (
        <details className="rounded-xl border border-line bg-surface p-5" open={events.length === 0}>
          <summary className="cursor-pointer text-lg font-bold">{c.add}</summary>
          <div className="mt-4">
            <RailEventForm dict={dict} year={year} />
          </div>
        </details>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-fg-muted">{c.empty}</p>
      ) : (
        groupByMonth(events).map((g) => (
          <section key={g.month} aria-labelledby={`mes-${g.month}`} className="flex flex-col gap-3">
            <h2 id={`mes-${g.month}`} className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
              {monthName("pt", g.month)}
            </h2>
            <ul className="flex flex-col gap-3">
              {g.events.map((ev) => (
                <li key={ev.id} className="rounded-xl border border-line bg-surface p-4" data-rail-event={ev.name}>
                  {editable && editId === ev.id ? (
                    <>
                      <h3 className="mb-4 font-bold">{c.editTitle}</h3>
                      <RailEventForm dict={dict} year={year} item={ev} cancelHref={tabHref(year)} />
                    </>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-fg-muted">{formatEventRange("pt", ev.starts_on, ev.ends_on)}</p>
                        <p className="text-lg font-bold leading-snug">{ev.name}</p>
                        <p className="text-sm text-fg-muted">
                          {[ev.city, countryName("pt", ev.country) || c.online].filter(Boolean).join(", ")} · {c.kinds[ev.kind]} · {c.regions[ev.region]}
                        </p>
                        {ev.description && <p className="mt-2 text-sm">{ev.description}</p>}
                        {ev.source_note && <p className="mt-2 text-xs text-fg-muted">{c.sourceNote}: {ev.source_note}</p>}
                        {ev.url && (
                          <a href={ev.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                            {c.official} ↗
                          </a>
                        )}
                      </div>
                      {editable && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`${tabHref(year)}${year === current ? "?" : "&"}editar=${ev.id}`} className="inline-flex min-h-9 items-center rounded-full border border-line-strong px-4 text-sm font-bold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                            {dict.common.edit}
                          </Link>
                          <RemoveRailEvent dict={dict} id={ev.id} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
