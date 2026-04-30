import { HeroSection } from "@/components/sections/HeroSection";
import { ManifestoSection } from "@/components/sections/ManifestoSection";
import { MetricsSection } from "@/components/sections/MetricsSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { VisitsSection } from "@/components/sections/VisitsSection";
import { EventsSection } from "@/components/sections/EventsSection";
import { CompaniesSection } from "@/components/sections/CompaniesSection";
import { CtaSection } from "@/components/sections/CtaSection";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#1A1A1A] text-white overflow-x-hidden">
      <HeroSection />
      <ManifestoSection />
      <MetricsSection />
      <AboutSection />
      <VisitsSection />
      <EventsSection />
      <CompaniesSection />
      <CtaSection />
    </main>
  );
}