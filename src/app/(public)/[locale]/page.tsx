import type { Metadata } from "next";
import { PendingSection } from "@/components/editorial/PendingContent";
import { CourseFronts, ExperiencesPreview, FeaturedProjects, HomeHero, IndicatorsStrip, NewsPreview, PartnersStrip } from "@/components/public/home/HomeSections";
import { HomeExperiences } from "@/components/public/home/HomeExperiences";
import { ResearchTeaser } from "@/components/public/home/ResearchTeaser";
import { UpcomingEvents } from "@/components/public/home/UpcomingEvents";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { shareImageUrl } from "@/lib/content/media";
import { institutionalToday, upcomingEvents } from "@/lib/calendar/rail";
import { listPublicProjects, listPublicRailEvents, listPublished, publicCoverIds, publicSiteImage } from "@/lib/content/public";
import { listShorts } from "@/lib/content/videos";
import { ShortsStrip } from "@/components/public/ShortsStrip";
import { publicPageMetadata } from "@/i18n/metadata";

// Conteúdo publicado e fotos do Drive: sem isto a Home ficava congelada na versão do build
// (ex.: sem fotos se o Drive estava fora no deploy) até a próxima publicação.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const hero = await publicSiteImage("home_hero", l);
  const image = hero ? { url: shareImageUrl(hero.fileId), alt: hero.alt } : null;
  return { ...publicPageMetadata(l, "/", { title: dict.site.name, image }), title: { absolute: dict.site.name } };
}

/**
 * Home (DESIGN-D, "o curso na linha"): título + foto grande → experiências (destaque + lista) →
 * próximos eventos do setor (calendário real) → vídeo → frentes do curso → projetos → pesquisa e
 * empresas. Blocos do protótipo seguem a quarentena (só em `review`); em EN, as seções sem texto
 * próprio aparecem como pendentes (nada de PT como fallback, 24).
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const editorial = l === "pt";
  const [hero, experiences, projects, shorts, railEvents] = await Promise.all([publicSiteImage("home_hero", l), listPublished("experience", l, 6), listPublicProjects(), listShorts(), listPublicRailEvents()]);
  const visibleProjects = l === "en" ? projects.filter((p) => p.name_en) : projects;
  const sortedExperiences = [...experiences].sort((a, b) => (b.event_at ?? b.published_at).localeCompare(a.event_at ?? a.published_at)).slice(0, 5);
  const [covers, projectCovers] = await Promise.all([publicCoverIds(sortedExperiences), publicCoverIds(visibleProjects.map((p) => ({ id: p.id, cover_file_id: p.cover_file_id })))]);
  const today = institutionalToday();

  return (
    <>
      <HomeHero locale={l} dict={dict.home.hero} hero={hero} />
      <HomeExperiences locale={l} dict={dict.home.experiences} items={sortedExperiences} covers={covers} cardDict={dict.experiences} />
      <UpcomingEvents locale={l} dict={dict.home.upcoming} regions={dict.calendar.regions} events={upcomingEvents(railEvents, today)} year={Number(today.slice(0, 4))} />
      <ShortsStrip videos={shorts} labels={dict.videos} tone="surface" />
      <CourseFronts locale={l} dict={dict.home.fronts} />
      {editorial ? (
        <>
          <IndicatorsStrip dict={dict.home.indicators} />
          <FeaturedProjects locale={l} dict={dict.home.projects} projects={visibleProjects} covers={projectCovers} fullDict={dict} />
          {/* O bloco do protótipo duplicava as visitas reais (e anunciava datas já passadas). */}
          {experiences.length === 0 && <ExperiencesPreview locale={l} dict={dict.home.experiences} />}
          <ResearchTeaser locale={l} dict={dict.home.research} capabilityNames={dict.capabilities} />
          <NewsPreview locale={l} dict={dict.home.news} />
          <PartnersStrip dict={dict.home.partners} />
        </>
      ) : (
        <PendingSection dict={dict} />
      )}
    </>
  );
}
