import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import {
  AboutCourse,
  CourseCta,
  CourseHero,
  CourseJourney,
  CourseLabs,
  CoursePillarsSection,
} from "@/components/public/course/CourseSections";
import { Suspense } from "react";
import { CurriculumExplorer } from "@/components/curriculum/CurriculumExplorer";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/curso";

export async function generateMetadata({ params }: PageProps<"/[locale]/curso">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.course);
}

/**
 * O Curso (04 §O Curso, guia §7): hero → sobre/dados → pilares → trajetória
 * (derivada do dataset) → explorador do fluxograma (FLOW-002) → laboratórios
 * (PDF do portfólio) → CTA. Conteúdo institucional
 * sob quarentena; EN mostra indisponibilidade até haver conteúdo por locale.
 */
export default async function CursoPage({ params }: PageProps<"/[locale]/curso">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const full = getDictionary(l);
  const dict = full.course;

  return (
    <>
      <CourseHero dict={dict.hero} />
      <AboutCourse dict={dict.about} />
      <CoursePillarsSection dict={dict.pillars} />
      <CourseJourney locale={l} dict={dict.journey} />
      <UnverifiedContent section="curso.flowchart">
        <div id="fluxograma" className="bg-canvas">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            {/* useSearchParams exige Suspense em páginas estáticas */}
            <Suspense fallback={<p className="text-fg-muted">{full.states.loading}</p>}>
              <CurriculumExplorer labels={full.flowchart} locale={l} />
            </Suspense>
          </div>
        </div>
      </UnverifiedContent>
      <CourseLabs dict={dict.labs} locale={l} allLabel={full.labs.back} />
      <CourseCta dict={dict.cta} />
    </>
  );
}
