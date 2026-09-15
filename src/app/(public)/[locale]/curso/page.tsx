import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";

import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { CursoHero } from "@/components/sections/CursoHero";
import { CoursePillars } from "@/components/sections/CoursePillars";
import { CourseCrea } from "@/components/sections/CourseCrea";
import { CurriculumFlowchart } from "@/components/ui/CurriculumFlowchart";

const PATH = "/curso";

export async function generateMetadata({ params }: PageProps<"/[locale]/curso">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.course);
}

export default async function CursoPage({ params }: PageProps<"/[locale]/curso">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <UnverifiedContent section="curso.hero" badgePosition="bottom-left"><CursoHero /></UnverifiedContent>
      <UnverifiedContent section="curso.pillars"><CoursePillars /></UnverifiedContent>
      <UnverifiedContent section="curso.crea"><CourseCrea /></UnverifiedContent>
      <UnverifiedContent section="curso.curriculum"><CurriculumFlowchart /></UnverifiedContent>
    </div>
  );
}
