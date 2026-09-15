import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";

import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
/**
 * Página de Notícias
 * Apresenta as últimas atualizações e notícias.
 */
import { NewsHero } from "@/components/sections/NewsHero";
import { NewsFeatured } from "@/components/sections/NewsFeatured";
import { NewsGrid } from "@/components/sections/NewsGrid";
import { NewsNewsletter } from "@/components/sections/NewsNewsletter";
import { CtaSection } from "@/components/sections/CtaSection";

const PATH = "/noticias";

export async function generateMetadata({ params }: PageProps<"/[locale]/noticias">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.news);
}

export default async function NoticiasPage({ params }: PageProps<"/[locale]/noticias">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <UnverifiedContent section="noticias.hero" badgePosition="bottom-left"><NewsHero /></UnverifiedContent>
      <UnverifiedContent section="noticias.featured"><NewsFeatured /></UnverifiedContent>
      <UnverifiedContent section="noticias.grid"><NewsGrid /></UnverifiedContent>
      <UnverifiedContent section="noticias.newsletter"><NewsNewsletter /></UnverifiedContent>
      
      <div className="py-20 border-t border-white/5 bg-[#0A0A0A]">
        <CtaSection locale={l} content={getDictionary(l).cta} />
      </div>
    </div>
  );
}
