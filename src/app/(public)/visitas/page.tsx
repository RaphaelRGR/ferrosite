/**
 * Página de Visitas
 * Apresenta informações sobre agendamentos e visitas.
 */
import { Metadata } from "next";
import { VisitsHero } from "@/components/sections/VisitsHero";
import { VisitsStats } from "@/components/sections/VisitsStats";
import { VisitsGallery } from "@/components/sections/VisitsGallery";
import { VisitsSchedule } from "@/components/sections/VisitsSchedule";
import { CtaSection } from "@/components/sections/CtaSection";

export const metadata: Metadata = {
  title: "Visitas Técnicas | FerroSite",
  description: "Explore as visitas técnicas do curso de Engenharia Ferroviária da UFSC. Vivência prática nas maiores concessionárias do Brasil.",
};

export default function VisitasPage() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <VisitsHero />
      <VisitsStats />
      <VisitsGallery />
      <VisitsSchedule />
      
      <div className="py-20 border-t border-white/5">
        <CtaSection />
      </div>
    </main>
  );
}
