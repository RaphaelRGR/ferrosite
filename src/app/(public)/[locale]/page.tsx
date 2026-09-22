import type { Metadata } from "next";
import { PendingSection } from "@/components/layout/PendingContent";
import {
  CourseFronts,
  ExperiencesPreview,
  FeaturedProjects,
  FinalCta,
  HomeHero,
  IndicatorsStrip,
  NewsPreview,
  PartnersStrip, PublishedExperiences } from "@/components/public/home/HomeSections";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { listPublicProjects, listPublished, publicCoverIds, publicSiteImage } from "@/lib/content/public";
import { listShorts } from "@/lib/content/videos";
import { ShortsStrip } from "@/components/public/ShortsStrip";
import { publicPageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  return { ...publicPageMetadata(l, "/", { title: dict.site.name }), title: { absolute: dict.site.name } };
}

/**
 * Home (04 §Home, guia §6): hero → indicadores → 4 frentes → projetos →
 * experiências → notícias → parceiros → CTA. Blocos com conteúdo institucional
 * vêm do staging sob quarentena; em EN esses blocos aparecem como pendentes
 * (nada de PT como fallback, 24).
 */
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const editorial = l === "pt";
  const [hero, experiences, projects, shorts] = await Promise.all([publicSiteImage("home_hero", l), listPublished("experience", l, 6), listPublicProjects(), listShorts()]);
  const visibleProjects = l === "en" ? projects.filter((p) => p.name_en) : projects;
  const [covers, projectCovers] = await Promise.all([publicCoverIds(experiences), publicCoverIds(visibleProjects.map((p) => ({ id: p.id, cover_file_id: p.cover_file_id })))]);

  return (
    <>
      <HomeHero locale={l} dict={dict.home.hero} hero={hero} />
      <PublishedExperiences locale={l} dict={dict.home.experiences} items={[...experiences].sort((a, b) => (b.event_at ?? b.published_at).localeCompare(a.event_at ?? a.published_at))} covers={covers} />
      <ShortsStrip videos={shorts} labels={dict.videos} tone="canvas" />
      {editorial ? <IndicatorsStrip dict={dict.home.indicators} /> : null}
      <CourseFronts locale={l} dict={dict.home.fronts} />
      {editorial ? (
        <>
          <FeaturedProjects locale={l} dict={dict.home.projects} projects={visibleProjects} covers={projectCovers} fullDict={dict} />
          <ExperiencesPreview locale={l} dict={dict.home.experiences} />
          <NewsPreview locale={l} dict={dict.home.news} />
          <PartnersStrip dict={dict.home.partners} />
        </>
      ) : (
        <PendingSection dict={dict} />
      )}
      <FinalCta locale={l} dict={dict.home.cta} />
    </>
  );
}
