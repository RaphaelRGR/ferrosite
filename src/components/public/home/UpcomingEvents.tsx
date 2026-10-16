import Link from "next/link";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryName, formatEventRange, type RailEvent, type RailRegion } from "@/lib/calendar/rail";

const DOT: Record<RailRegion, string> = { brasil: "bg-[var(--board-brasil)]", mundo: "bg-[var(--board-mundo)]" };

/**
 * Próximos eventos do setor (DESIGN-D): faixa escura com a cara de um quadro de partidas, mas o texto
 * diz o que é (feiras, congressos e seminários; nunca horários de trem). Dados reais do calendário
 * (`public_rail_event`); sem evento futuro, uma frase e o link para o calendário, sem sumir calado.
 */
export function UpcomingEvents({
  locale,
  dict,
  regions,
  events,
  year,
}: {
  locale: Locale;
  dict: Dictionary["home"]["upcoming"];
  regions: Record<RailRegion, string>;
  events: RailEvent[];
  year: number;
}) {
  const calendar = localizePath(locale, "/calendario");
  return (
    <section aria-labelledby="proximos-eventos" className="section-regular bg-[var(--board-bg)] text-[var(--board-fg)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div data-reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow mb-3 text-[var(--board-date)]">
              <span aria-hidden="true" className="rail-mark h-0.5 w-6 rounded-full bg-[var(--board-date)]" />
              {dict.eyebrow}
            </p>
            <h2 id="proximos-eventos" className="t-section font-black">
              {dict.title}
            </h2>
            <p className="t-lead mt-3 text-[var(--board-muted)]">{dict.description}</p>
          </div>
          <Link
            href={calendar}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded text-[15px] font-bold text-[var(--board-date)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--board-date)]"
          >
            {dict.link} <span aria-hidden="true">→</span>
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="mt-10 border-t border-[var(--board-line)] pt-6 text-[var(--board-muted)]">{dict.empty.replace("{year}", String(year))}</p>
        ) : (
          <table className="mt-10 w-full text-left">
            <caption className="sr-only">{dict.title}</caption>
            <thead className="hidden text-sm text-[var(--board-muted)] md:table-header-group">
              <tr className="border-b border-[var(--board-line)]">
                <th scope="col" className="pb-3 pr-6 font-semibold">{dict.columns.date}</th>
                <th scope="col" className="pb-3 pr-6 font-semibold">{dict.columns.event}</th>
                <th scope="col" className="pb-3 pr-6 font-semibold">{dict.columns.place}</th>
                <th scope="col" className="pb-3 font-semibold">{dict.columns.region}</th>
              </tr>
            </thead>
            <tbody data-reveal-group>
              {events.map((e) => {
                const place = [e.city, countryName(locale, e.country)].filter(Boolean).join(", ");
                return (
                  // No celular cada linha vira um bloco (data, nome, local · região); no desktop, colunas.
                  <tr key={e.id} className="grid grid-cols-1 gap-1 border-b border-[var(--board-line)] py-5 md:table-row md:py-0">
                    <td className="f-display text-xl font-black text-[var(--board-date)] md:w-56 md:py-5 md:pr-6 md:align-top">
                      <time dateTime={e.starts_on}>{formatEventRange(locale, e.starts_on, e.ends_on)}</time>
                    </td>
                    <td className="text-lg font-bold leading-snug md:py-5 md:pr-6 md:align-top">
                      {e.url ? (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={dict.official.replace("{name}", e.name)}
                          className="rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--board-date)]"
                        >
                          {e.name} <span aria-hidden="true" className="text-[var(--board-muted)]">↗</span>
                        </a>
                      ) : (
                        e.name
                      )}
                    </td>
                    <td className="text-[var(--board-muted)] md:py-5 md:pr-6 md:align-top">{place}</td>
                    <td className="text-[var(--board-muted)] md:py-5 md:align-top">
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true" className={`size-2.5 rounded-full ${DOT[e.region]}`} />
                        {regions[e.region]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
