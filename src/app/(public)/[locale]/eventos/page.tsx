import type { Metadata } from "next";
import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { EventsHero } from "@/components/sections/EventsHero";
import { FeaturedEvent } from "@/components/sections/FeaturedEvent";
import { EventsGrid } from "@/components/sections/EventsGrid";
import { PastEventsGallery } from "@/components/sections/PastEventsGallery";
import { CtaSection } from "@/components/sections/CtaSection";

const PATH = "/eventos";

export async function generateMetadata({ params }: PageProps<"/[locale]/eventos">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.events);
}

export default async function EventosPage({ params }: PageProps<"/[locale]/eventos">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <EventsHero />
      <FeaturedEvent />
      <EventsGrid />
      <PastEventsGallery />
      
      <div className="py-20 border-t border-white/5 bg-[#0A0A0A]">
        <CtaSection locale={l} content={getDictionary(l).cta} />
      </div>
    </div>
  );
}
