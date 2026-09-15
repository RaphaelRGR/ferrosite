import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";

import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
/**
 * Página de Visitas
 * Apresenta informações sobre agendamentos e visitas.
 */
import { VisitsHero } from "@/components/sections/VisitsHero";
import { VisitsStats } from "@/components/sections/VisitsStats";
import { VisitsGallery } from "@/components/sections/VisitsGallery";
import { VisitsSchedule } from "@/components/sections/VisitsSchedule";
import { CtaSection } from "@/components/sections/CtaSection";

const PATH = "/experiencias";

export async function generateMetadata({ params }: PageProps<"/[locale]/experiencias">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.visits);
}

export default async function VisitasPage({ params }: PageProps<"/[locale]/experiencias">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <UnverifiedContent section="visitas.hero" badgePosition="bottom-left"><VisitsHero /></UnverifiedContent>
      <UnverifiedContent section="visitas.stats"><VisitsStats /></UnverifiedContent>
      <UnverifiedContent section="visitas.gallery"><VisitsGallery /></UnverifiedContent>
      <UnverifiedContent section="visitas.schedule"><VisitsSchedule /></UnverifiedContent>
      
      <div className="py-20 border-t border-white/5">
        <CtaSection locale={l} content={getDictionary(l).cta} />
      </div>
    </div>
  );
}
