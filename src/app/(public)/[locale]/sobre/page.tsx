import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";

import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
/**
 * Página Sobre
 * Apresenta informações e contexto sobre o portal FerroSite e o Comunica Ferro/UFSC Joinville.
 */

import { AboutHero } from "@/components/sections/AboutHero";
import { StoryJourney } from "@/components/sections/StoryJourney";
import { AboutIdentity } from "@/components/sections/AboutIdentity";
import { AboutResearch } from "@/components/sections/AboutResearch";
import { CtaSection } from "@/components/sections/CtaSection";

const PATH = "/sobre";

export async function generateMetadata({ params }: PageProps<"/[locale]/sobre">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.about);
}

export default async function SobrePage({ params }: PageProps<"/[locale]/sobre">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <UnverifiedContent section="sobre.hero" badgePosition="bottom-left"><AboutHero /></UnverifiedContent>
      <UnverifiedContent section="sobre.story"><StoryJourney /></UnverifiedContent>
      <UnverifiedContent section="sobre.identity"><AboutIdentity /></UnverifiedContent>
      <UnverifiedContent section="sobre.research"><AboutResearch /></UnverifiedContent>
      
      <div className="py-20 border-t border-white/5">
        <CtaSection locale={l} content={getDictionary(l).cta} />
      </div>
    </div>
  );
}
