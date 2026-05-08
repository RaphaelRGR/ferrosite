import { Metadata } from "next";
import { EventsHero } from "@/components/sections/EventsHero";
import { FeaturedEvent } from "@/components/sections/FeaturedEvent";
import { EventsGrid } from "@/components/sections/EventsGrid";
import { PastEventsGallery } from "@/components/sections/PastEventsGallery";
import { CtaSection } from "@/components/sections/CtaSection";

export const metadata: Metadata = {
  title: "Eventos | FerroSite",
  description: "Fique por dentro de todos os eventos, competições e workshops da Engenharia Ferroviária da UFSC.",
};

export default function EventosPage() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <EventsHero />
      <FeaturedEvent />
      <EventsGrid />
      <PastEventsGallery />
      
      <div className="py-20 border-t border-white/5 bg-[#0A0A0A]">
        <CtaSection />
      </div>
    </main>
  );
}
