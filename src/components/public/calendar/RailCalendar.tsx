"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryName, formatEventRange, groupByMonth, isPastEvent, monthName, type RailEvent, type RailRegion } from "@/lib/calendar/rail";

/**
 * Calendário ferroviário público (CAL-001): eventos do ano por mês, filtro Brasil/Mundo no cliente
 * (a página continua estática com revalidação). Em EN, a descrição só aparece se tiver versão em inglês;
 * o nome oficial do evento vale para as duas línguas.
 */
export function RailCalendar({ events, locale, dict, today, year }: { events: RailEvent[]; locale: Locale; dict: Dictionary["calendar"]; today: string; year: number }) {
  const [filter, setFilter] = useState<"all" | RailRegion>("all");
  const shown = filter === "all" ? events : events.filter((e) => e.region === filter);
  const options: Array<{ value: "all" | RailRegion; label: string }> = [
    { value: "all", label: dict.all },
    { value: "brasil", label: dict.regions.brasil },
    { value: "mundo", label: dict.regions.mundo },
  ];

  if (events.length === 0) return <p className="mt-10 text-fg-muted">{dict.empty.replace("{year}", String(year))}</p>;

  return (
    <div className="mt-10 flex flex-col gap-10">
      <div role="group" aria-label={dict.filter} className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-bold text-fg-muted">{dict.filter}:</span>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={filter === o.value}
            onClick={() => setFilter(o.value)}
            className={`min-h-11 rounded-full border px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${filter === o.value ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-fg-muted" aria-live="polite">
          {dict.count.replace("{count}", String(shown.length))}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="text-fg-muted">{dict.emptyFiltered}</p>
      ) : (
        groupByMonth(shown).map((g) => (
          <section key={g.month} aria-labelledby={`mes-${g.month}`}>
            <h2 id={`mes-${g.month}`} className="border-b border-line pb-2 text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
              {monthName(locale, g.month)}
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {g.events.map((e) => {
                const past = isPastEvent(e, today);
                const description = locale === "en" ? e.description_en : e.description;
                const place = [e.city, countryName(locale, e.country)].filter(Boolean).join(", ");
                return (
                  <li key={e.id} className={`flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 ${past ? "opacity-60" : ""}`}>
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
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
