/**
 * Página de Notícias
 * Apresenta as últimas atualizações e notícias.
 */
import { Metadata } from "next";
import { NewsHero } from "@/components/sections/NewsHero";
import { NewsFeatured } from "@/components/sections/NewsFeatured";
import { NewsGrid } from "@/components/sections/NewsGrid";
import { NewsNewsletter } from "@/components/sections/NewsNewsletter";
import { CtaSection } from "@/components/sections/CtaSection";

export const metadata: Metadata = {
  title: "Notícias | FerroSite",
  description: "Acompanhe as últimas notícias, projetos e inovações da Engenharia Ferroviária da UFSC.",
};

export default function NoticiasPage() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen">
      <NewsHero />
      <NewsFeatured />
      <NewsGrid />
      <NewsNewsletter />
      
      <div className="py-20 border-t border-white/5 bg-[#0A0A0A]">
        <CtaSection />
      </div>
    </main>
  );
}
