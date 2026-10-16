import type { Metadata } from "next";
import { RailCalendar } from "@/components/public/calendar/RailCalendar";
import { SectionHeading } from "@/components/public/SectionHeading";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { institutionalToday } from "@/lib/calendar/rail";
import { listPublicRailEvents } from "@/lib/content/public";

// eventos cadastrados no Portal aparecem em até 5 min (e na hora, pela revalidação das ações)
export const revalidate = 300;
const PATH = "/calendario";

export async function generateMetadata({ params }: PageProps<"/[locale]/calendario">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.calendar);
}

/**
 * Calendário ferroviário (CAL-001): eventos do setor no Brasil e no mundo, sempre do ano corrente
 * (a projeção `public_rail_event` filtra o ano no fuso do curso). Cadastro em /portal/calendario.
 */
export default async function CalendarPage({ params }: PageProps<"/[locale]/calendario">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const today = institutionalToday();
  const year = Number(today.slice(0, 4));
  const events = await listPublicRailEvents();

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 section-compact">
        <SectionHeading as="h1" eyebrow={dict.pages.calendar.title} title={dict.calendar.heading.replace("{year}", String(year))} description={dict.calendar.intro} />
        <RailCalendar events={events} locale={l} dict={dict.calendar} today={today} year={year} />
      </div>
    </section>
  );
}
