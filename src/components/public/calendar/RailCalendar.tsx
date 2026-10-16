"use client";

import { useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  countryName, eventsInMonth, formatEventRange, groupByMonth, isPastEvent, monthMatrix, monthName, weekdayNames,
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

      {view === "list" ? <ListView events={shown} locale={locale} dict={dict} today={today} /> : <YearView events={shown} locale={locale} dict={dict} today={today} year={year} />}
    </div>
  );
}

function ListView({ events, locale, dict, today }: { events: RailEvent[]; locale: Locale; dict: Dict; today: string }) {
  if (events.length === 0) return <p className="text-fg-muted">{dict.emptyFiltered}</p>;
  return (
    <>
      {groupByMonth(events).map((g) => (
        <section key={g.month} aria-labelledby={`mes-${g.month}`}>
          <h2 id={`mes-${g.month}`} className="t-subsection border-b border-line pb-2 font-black">
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

/** Cor por região: Brasil no laranja da marca, Mundo em azul (texto branco AA nos dois, site em tema claro). */
const REGION_BG: Record<RailRegion, string> = { brasil: "bg-action text-fg-on-action", mundo: "bg-info text-fg-on-action" };
const REGION_DOT: Record<RailRegion, string> = { brasil: "bg-action", mundo: "bg-info" };

/**
 * Visão "Calendário" (CAL-001): o ano inteiro como calendário de parede. 12 meses pequenos; os dias de
 * evento viram faixas contínuas na cor da região; abaixo de cada mês, os eventos dele, que abrem os
 * detalhes (clicar no dia colorido abre o evento). No celular, meses sem evento ficam ocultos.
 */
function YearView({ events, locale, dict, today, year }: { events: RailEvent[]; locale: Locale; dict: Dict; today: string; year: number }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (events.length === 0) return <p className="text-fg-muted">{dict.emptyFiltered}</p>;
  const initials = weekdayNames(locale).map((w) => w.charAt(0).toUpperCase());

  return (
    <div className="flex flex-col gap-6">
      <ul aria-label={dict.legend} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
        {(["brasil", "mundo"] as const).map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-3 w-6 rounded-full ${REGION_DOT[r]}`} />
            {dict.regions[r]}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-4 rounded-full ring-2 ring-fg" />
          {dict.today}
        </li>
      </ul>

      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <MonthCard key={m} year={year} month={m} events={eventsInMonth(events, year, m)} locale={locale} dict={dict} today={today} initials={initials} openId={openId} onOpen={setOpenId} />
        ))}
      </ol>
      <p className="text-xs text-fg-muted sm:hidden">{dict.emptyMonthsHidden}</p>
    </div>
  );
}

function MonthCard({ year, month, events, locale, dict, today, initials, openId, onOpen }: {
  year: number; month: number; events: RailEvent[]; locale: Locale; dict: Dict; today: string; initials: string[];
  openId: string | null; onOpen: (id: string | null) => void;
}) {
  const weeks = monthMatrix(year, month);
  const lastDay = `${year}-${String(month).padStart(2, "0")}-31`;
  const pastMonth = lastDay < today;
  const fmtDay = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-GB", { timeZone: "UTC", day: "numeric", month: "long" });
  const dayEvent = (d: string | null) => (d ? events.find((e) => e.starts_on <= d && (e.ends_on ?? e.starts_on) >= d) ?? null : null);
  const sorted = [...events].sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const title = `${monthName(locale, month)} ${year}`;

  return (
    <li className={`flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5 ${events.length === 0 ? "hidden sm:flex" : "flex"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={`text-lg font-black ${pastMonth ? "text-fg-muted" : ""}`}>{monthName(locale, month)}</h2>
        <span className="text-xs font-bold text-fg-muted">{events.length === 0 ? dict.emptyMonth : events.length === 1 ? dict.countOne : dict.count.replace("{count}", String(events.length))}</span>
      </div>

      <table className="mt-3 w-full table-fixed border-separate border-spacing-y-1 text-center text-xs">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            {initials.map((w, i) => (
              <th key={i} scope="col" className="pb-1 text-[10px] font-bold text-fg-muted">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => {
                if (!d) return <td key={di} />;
                const ev = dayEvent(d);
                const n = Number(d.slice(8));
                const todayRing = d === today ? "ring-2 ring-inset ring-fg" : "";
                if (!ev) {
                  return (
                    <td key={di} className="p-0">
                      <span className={`mx-auto flex size-8 items-center justify-center rounded-full ${d < today ? "text-fg-muted" : ""} ${todayRing}`}>{n}</span>
                    </td>
                  );
                }
                // faixa contínua: arredonda só nas pontas do evento (ou da semana)
                const roundL = dayEvent(di > 0 ? week[di - 1] : null)?.id !== ev.id ? "rounded-l-full" : "";
                const roundR = dayEvent(di < 6 ? week[di + 1] : null)?.id !== ev.id ? "rounded-r-full" : "";
                return (
                  <td key={di} className="p-0">
                    <button
                      type="button"
                      onClick={() => onOpen(openId === ev.id ? null : ev.id)}
                      aria-label={`${fmtDay.format(new Date(`${d}T12:00:00Z`))}: ${ev.name}`}
                      aria-expanded={openId === ev.id}
                      className={`flex h-8 w-full items-center justify-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${REGION_BG[ev.region]} ${roundL} ${roundR} ${isPastEvent(ev, today) && d !== today ? "opacity-50" : ""}`}
                    >
                      {/* hoje dentro da faixa: círculo claro com o número, sem quebrar a faixa */}
                      <span className={d === today ? "flex size-6 items-center justify-center rounded-full bg-surface text-fg" : ""}>{n}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {sorted.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
          {sorted.map((e) => (
            <MonthEvent key={e.id} event={e} locale={locale} dict={dict} today={today} open={openId === e.id} onToggle={(o) => onOpen(o ? e.id : openId === e.id ? null : openId)} />
          ))}
        </ul>
      )}
    </li>
  );
}

function MonthEvent({ event: e, locale, dict, today, open, onToggle }: { event: RailEvent; locale: Locale; dict: Dict; today: string; open: boolean; onToggle: (open: boolean) => void }) {
  const past = isPastEvent(e, today);
  const description = locale === "en" ? e.description_en : e.description;
  const place = [e.city, countryName(locale, e.country)].filter(Boolean).join(", ");
  return (
    <li className={past ? "opacity-70" : ""}>
      <details open={open} onToggle={(ev) => onToggle((ev.currentTarget as HTMLDetailsElement).open)} className="group rounded-xl open:bg-surface-2 hover:bg-surface-2">
        <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ${REGION_DOT[e.region]}`} />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-fg-muted">
              {formatEventRange(locale, e.starts_on, e.ends_on)}
              {past ? ` · ${dict.past}` : ""}
            </span>
            <span className="block text-sm font-bold leading-snug">{e.name}</span>
          </span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 size-4 shrink-0 text-fg-muted transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="flex flex-col gap-2 pb-3 pl-7 pr-2 text-sm">
          <p className="text-fg-muted">
            {dict.kinds[e.kind]} · {dict.regions[e.region]}
            {place ? ` · ${place}` : ""}
          </p>
          {description && <p>{description}</p>}
          {e.url && (
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              {dict.official} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </details>
    </li>
  );
}

function EventCard({ event: e, locale, dict, today }: { event: RailEvent; locale: Locale; dict: Dict; today: string }) {
  const past = isPastEvent(e, today);
  const description = locale === "en" ? e.description_en : e.description;
  const place = [e.city, countryName(locale, e.country)].filter(Boolean).join(", ");
  return (
    <li className={`flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 ${past ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 meta">
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
