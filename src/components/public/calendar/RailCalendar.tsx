"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  countryName, eventsInMonth, eventsOnDay, formatEventRange, groupByMonth, isPastEvent, monthMatrix, monthName, weekdayNames,
  type RailEvent, type RailRegion,
} from "@/lib/calendar/rail";

type Dict = Dictionary["calendar"];
type View = "list" | "grid";
const VIEW_KEY = "ferrosite.calendar.view";

// Preferência da visão no navegador (só conveniência). useSyncExternalStore: no servidor e na
// hidratação é sempre "lista"; sem armazenamento disponível, vale a escolha em memória.
let memoryView: View | null = null;
const viewListeners = new Set<() => void>();
function readView(): View {
  if (memoryView) return memoryView;
  try {
    return window.localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}
function subscribeView(cb: () => void) {
  viewListeners.add(cb);
  return () => {
    viewListeners.delete(cb);
  };
}
function saveView(v: View) {
  memoryView = v;
  try {
    window.localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* armazenamento indisponível: fica só em memória */
  }
  viewListeners.forEach((l) => l());
}

const PILL = "min-h-11 rounded-full border px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
const pill = (on: boolean) => `${PILL} ${on ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`;

/**
 * Calendário ferroviário público (CAL-001): a pessoa escolhe ver em lista (por mês) ou em calendário
 * (grade do mês, com navegação e seleção de dia). Filtro Brasil/Mundo vale para as duas; a escolha da
 * visão fica no navegador. A página continua estática com revalidação. Em EN, a descrição só aparece
 * se houver versão em inglês; o nome oficial do evento vale para as duas línguas.
 */
export function RailCalendar({ events, locale, dict, today, year }: { events: RailEvent[]; locale: Locale; dict: Dict; today: string; year: number }) {
  const [filter, setFilter] = useState<"all" | RailRegion>("all");
  const view = useSyncExternalStore(subscribeView, readView, () => "list" as View);
  const shown = filter === "all" ? events : events.filter((e) => e.region === filter);
  const chooseView = saveView;

  if (events.length === 0) return <p className="mt-10 text-fg-muted">{dict.empty.replace("{year}", String(year))}</p>;

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label={dict.view} className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-bold text-fg-muted">{dict.view}:</span>
          {(["list", "grid"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => chooseView(v)} className={pill(view === v)}>
              {dict.views[v]}
            </button>
          ))}
        </div>
        <div role="group" aria-label={dict.filter} className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-bold text-fg-muted">{dict.filter}:</span>
          {(["all", "brasil", "mundo"] as const).map((o) => (
            <button key={o} type="button" aria-pressed={filter === o} onClick={() => setFilter(o)} className={pill(filter === o)}>
              {o === "all" ? dict.all : dict.regions[o]}
            </button>
          ))}
        </div>
        <span className="text-sm text-fg-muted sm:ml-auto" aria-live="polite">
          {shown.length === 1 ? dict.countOne : dict.count.replace("{count}", String(shown.length))}
        </span>
      </div>

      {view === "list" ? <ListView events={shown} locale={locale} dict={dict} today={today} /> : <GridView events={shown} locale={locale} dict={dict} today={today} year={year} />}
    </div>
  );
}

function ListView({ events, locale, dict, today }: { events: RailEvent[]; locale: Locale; dict: Dict; today: string }) {
  if (events.length === 0) return <p className="text-fg-muted">{dict.emptyFiltered}</p>;
  return (
    <>
      {groupByMonth(events).map((g) => (
        <section key={g.month} aria-labelledby={`mes-${g.month}`}>
          <h2 id={`mes-${g.month}`} className="border-b border-line pb-2 text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
            {monthName(locale, g.month)}
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {g.events.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} dict={dict} today={today} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function GridView({ events, locale, dict, today, year }: { events: RailEvent[]; locale: Locale; dict: Dict; today: string; year: number }) {
  // mês inicial: o atual (se a página é do ano corrente) ou o primeiro com evento
  const initial = today.startsWith(String(year)) ? Number(today.slice(5, 7)) : Number(groupByMonth(events)[0]?.month ?? 1);
  const [month, setMonth] = useState(initial);
  const [day, setDay] = useState<string | null>(null);
  const go = (m: number) => {
    setMonth(Math.min(12, Math.max(1, m)));
    setDay(null);
  };
  const weeks = monthMatrix(year, month);
  const inMonth = eventsInMonth(events, year, month);
  const listed = day ? eventsOnDay(events, day) : inMonth;
  const label = `${monthName(locale, month)} ${year}`;
  const dateLong = (d: string) => new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-GB", { timeZone: "UTC", day: "numeric", month: "long" }).format(new Date(`${d}T12:00:00Z`));
  const hasEvents = (m: number) => eventsInMonth(events, year, m).length > 0;
  // no meio da frase, mês em minúscula em português ("Eventos de setembro"); em inglês, maiúscula
  const monthInText = (m: number) => (locale === "pt" ? monthName(locale, m).toLowerCase() : monthName(locale, m));

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label={dict.months} className="flex flex-wrap gap-1.5">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={m === month}
            onClick={() => go(m)}
            className={`relative min-h-9 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${m === month ? "border-action bg-action text-fg-on-action" : "border-line bg-surface hover:bg-surface-2"} ${hasEvents(m) ? "" : "text-fg-muted"}`}
          >
            {monthName(locale, m).slice(0, 3)}
            {hasEvents(m) && m !== month && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-action" />}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-5">
          <button type="button" onClick={() => go(month - 1)} disabled={month === 1} aria-label={dict.prevMonth} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <span aria-hidden="true">←</span>
          </button>
          <h2 className="text-lg font-black" aria-live="polite">{label}</h2>
          <button type="button" onClick={() => go(month + 1)} disabled={month === 12} aria-label={dict.nextMonth} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {weekdayNames(locale).map((w) => (
                <th key={w} scope="col" className="py-2 text-center text-[11px] font-bold uppercase tracking-widest text-fg-muted">
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((d, di) => {
                  if (!d) return <td key={di} className="border-t border-line bg-canvas/50" />;
                  const evs = eventsOnDay(events, d);
                  const n = Number(d.slice(8));
                  const isToday = d === today;
                  const selected = d === day;
                  const content = (
                    <>
                      <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-action font-black text-fg-on-action" : "font-bold"}`}>{n}</span>
                      {evs.length > 0 && (
                        <>
                          {/* celular: pontos; telas maiores: nome curto dos eventos */}
                          <span aria-hidden="true" className="mt-1 flex gap-0.5 sm:hidden">
                            {evs.slice(0, 3).map((e) => (
                              <span key={e.id} className={`size-1.5 rounded-full bg-link ${isPastEvent(e, today) ? "opacity-50" : ""}`} />
                            ))}
                          </span>
                          <span aria-hidden="true" className="mt-1 hidden w-full flex-col gap-0.5 sm:flex">
                            {evs.slice(0, 2).map((e) => (
                              <span key={e.id} className={`truncate rounded bg-surface-2 px-1.5 py-0.5 text-left text-[11px] font-bold text-link ${isPastEvent(e, today) ? "opacity-60" : ""}`}>
                                {e.name}
                              </span>
                            ))}
                            {evs.length > 2 && <span className="px-1.5 text-left text-[11px] text-fg-muted">+{evs.length - 2}</span>}
                          </span>
                        </>
                      )}
                    </>
                  );
                  return (
                    <td key={di} className="h-16 border-t border-line p-0 align-top sm:h-24">
                      {evs.length > 0 ? (
                        <button
                          type="button"
                          aria-pressed={selected}
                          aria-label={(evs.length === 1 ? dict.dayLabelOne : dict.dayLabel).replace("{date}", dateLong(d)).replace("{count}", String(evs.length))}
                          onClick={() => setDay(selected ? null : d)}
                          className={`flex size-full flex-col items-center p-1 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:items-start sm:p-1.5 ${selected ? "bg-surface-2 ring-2 ring-inset ring-action" : ""}`}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex size-full flex-col items-center p-1 text-fg-muted sm:items-start sm:p-1.5">{content}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="eventos-selecionados" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="eventos-selecionados" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
            {day ? dict.dayEvents.replace("{date}", dateLong(day)) : dict.monthEvents.replace("{month}", monthInText(month))}
          </h2>
          {day && (
            <button type="button" onClick={() => setDay(null)} className="rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              {dict.showMonth}
            </button>
          )}
        </div>
        {listed.length === 0 ? (
          <p className="text-fg-muted">{dict.noEventsMonth.replace("{month}", monthInText(month))}</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {listed.map((e) => (
              <EventCard key={e.id} event={e} locale={locale} dict={dict} today={today} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EventCard({ event: e, locale, dict, today }: { event: RailEvent; locale: Locale; dict: Dict; today: string }) {
  const past = isPastEvent(e, today);
  const description = locale === "en" ? e.description_en : e.description;
  const place = [e.city, countryName(locale, e.country)].filter(Boolean).join(", ");
  return (
    <li className={`flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 ${past ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-fg-muted">
        <span>{dict.kinds[e.kind]}</span>
        <span aria-hidden="true">·</span>
        <span>{dict.regions[e.region]}</span>
        {past && (
          <>
            <span aria-hidden="true">·</span>
            <span>{dict.past}</span>
          </>
        )}
      </div>
      <p className="text-sm font-bold text-link">{formatEventRange(locale, e.starts_on, e.ends_on)}</p>
      <p className="text-lg font-bold leading-snug">{e.name}</p>
      {place && <p className="text-sm text-fg-muted">{place}</p>}
      {description && <p className="text-sm">{description}</p>}
      {e.url && (
        <a href={e.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.official} <span aria-hidden="true">↗</span>
        </a>
      )}
    </li>
  );
}
