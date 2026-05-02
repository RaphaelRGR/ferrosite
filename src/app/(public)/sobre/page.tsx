/**
 * Página Sobre
 * Apresenta informações e contexto sobre o portal FerroSite e a AFER/UFSC Joinville.
 */
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre | FerroSite",
  description: "Conheça mais sobre o portal FerroSite",
};

import { AboutHero } from "@/components/sections/AboutHero";
import { StoryJourney } from "@/components/sections/StoryJourney";
import { AboutIdentity } from "@/components/sections/AboutIdentity";
import { AboutResearch } from "@/components/sections/AboutResearch";
import { CtaSection } from "@/components/sections/CtaSection";

export default function SobrePage() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <AboutHero />
      <StoryJourney />
      <AboutIdentity />
      <AboutResearch />
      
      <div className="py-20 border-t border-white/5">
        <CtaSection />
      </div>
    </main>
  );
}
