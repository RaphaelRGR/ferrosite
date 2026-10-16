import Image from "next/image";
import Link from "next/link";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { HeroArt } from "@/components/public/HeroArt";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { EXPERIENCES, FEATURED_PROJECTS, INDICATORS, NEWS, PARTNER_LOGOS } from "@/content/staging";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { mediaImage } from "@/lib/content/media";
import type { PublicProject } from "@/lib/content/public";
import { ProjectShowcase } from "@/components/public/projects/ProjectShowcase";

type HomeDict = Dictionary["home"];

export function HomeHero({ locale, dict, hero = null }: { locale: Locale; dict: HomeDict["hero"]; hero?: { fileId: string; alt: string; credit: string } | null }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 lg:pt-20">
        <div className="hero-in grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-4">
              <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-action" />
              {dict.subtitle}
            </p>
            <h1 className="t-display font-black">{dict.title}</h1>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-4 lg:pb-2">
            <p className="t-lead text-fg-muted">{dict.description}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <LinkButton href={localizePath(locale, "/curso")} size="lg">
                {dict.primary} <span aria-hidden="true">→</span>
              </LinkButton>
              <Link
                href={localizePath(locale, "/projetos")}
                className="inline-flex min-h-11 items-center gap-1 rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {dict.secondary} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Foto grande sob o título, sem texto por cima; no celular vai de ponta a ponta. */}
      <figure className="mx-auto mt-10 max-w-7xl sm:px-6 lg:mt-14">
        <div className="hero-media overflow-hidden sm:rounded-2xl">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia), sem otimização externa
            <img {...mediaImage(hero.fileId, "wide")} alt={hero.alt} className="aspect-[4/3] w-full object-cover object-[center_40%] sm:aspect-[16/9] lg:aspect-[21/9]" fetchPriority="high" />
          ) : (
            <HeroArt title={dict.artAlt} />
          )}
        </div>
        <figcaption className="mt-3 px-4 text-sm text-fg-muted sm:px-0">{hero ? (hero.credit ? `${dict.photoCredit}: ${hero.credit}` : hero.alt) : dict.artNote}</figcaption>
      </figure>
    </section>
  );
}

export function IndicatorsStrip({ dict }: { dict: HomeDict["indicators"] }) {
  return (
    <UnverifiedContent section="home.indicators">
      <section aria-labelledby="indicadores" className="border-y border-line bg-canvas">
        <h2 id="indicadores" className="sr-only">
          {dict.title}
        </h2>
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {INDICATORS.map((i) => (
            <li key={i.id} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-1 size-2 rounded-full bg-action" />
              <div>
                <p className="text-2xl font-black">{i.value}</p>
                <p className="text-sm text-fg-muted">{i.label}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto max-w-7xl px-4 pb-6 text-xs text-fg-muted sm:px-6">{dict.note}</p>
      </section>
    </UnverifiedContent>
  );
}

/** Frentes do curso (DESIGN-D): lista tipográfica, uma linha por frente; a linha inteira leva ao Curso. */
export function CourseFronts({ locale, dict }: { locale: Locale; dict: HomeDict["fronts"] }) {
  const items = (["infra", "rolling", "signalling", "operations"] as const).map((key) => ({ key, ...dict.items[key] }));
  // Em EN a página do curso está pendente e não tem a âncora.
  const target = localizePath(locale, "/curso") + (locale === "pt" ? "#frentes" : "");
  return (
    <section className="section-regular bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} link={{ href: target, label: dict.link }} />
        <ul className="mt-10 border-t border-line" data-reveal-group>
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={target}
                className="group -mx-3 grid gap-2 rounded-xl border-b border-line px-3 py-6 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] sm:items-center sm:gap-8"
              >
                <span className="t-subsection f-display font-black group-hover:text-link">{item.title}</span>
                <span className="text-fg-muted">{item.description}</span>
                <span aria-hidden="true" className="hidden text-2xl text-link transition-transform group-hover:translate-x-1 sm:block">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FeaturedProjects({ locale, dict, projects = [], covers = new Map(), fullDict }: { locale: Locale; dict: HomeDict["projects"]; projects?: PublicProject[]; covers?: Map<string, string>; fullDict?: Dictionary }) {
  if (projects.length > 0 && fullDict) {
    return (
      <section className="section-regular bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} link={{ href: localizePath(locale, "/projetos"), label: dict.link }} />
          <div className="mt-10">
            <ProjectShowcase projects={projects} covers={covers} locale={locale} dict={fullDict} detailLabel={dict.detail} />
          </div>
        </div>
      </section>
    );
  }
  return (
    <UnverifiedContent section="home.projects">
      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} link={{ href: localizePath(locale, "/projetos"), label: dict.link }} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED_PROJECTS.map((p) => (
              <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
                <div aria-hidden="true" className="h-32 bg-gradient-to-br from-surface-2 to-canvas" />
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <Badge tone="neutral">{p.meta}</Badge>
                  <p className="text-lg font-bold">{p.title}</p>
                  <p className="text-sm text-fg-muted">{p.description}</p>
                  <Link
                    href={localizePath(locale, `/projetos/${p.id}`)}
                    className="mt-auto inline-flex items-center gap-1 rounded pt-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {dict.detail} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </UnverifiedContent>
  );
}


export function ExperiencesPreview({ locale, dict }: { locale: Locale; dict: HomeDict["experiences"] }) {
  const groups = [
    { key: "brasil", label: dict.brazil, items: EXPERIENCES.filter((e) => e.scope === "brasil") },
    { key: "internacional", label: dict.international, items: EXPERIENCES.filter((e) => e.scope === "internacional") },
  ];
  return (
    <UnverifiedContent section="home.experiences">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} link={{ href: localizePath(locale, "/experiencias"), label: dict.link }} />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.key} className="rounded-2xl border border-line bg-canvas p-6">
                <h3 className="meta text-link">{g.label}</h3>
                <ol className="mt-4 border-l-2 border-line pl-5">
                  {g.items.map((e) => (
                    <li key={e.id} className="relative pb-5 last:pb-0">
                      <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface bg-action" />
                      <p className="meta">
                        {e.when} · {e.meta}
                      </p>
                      <p className="font-bold">{e.title}</p>
                      <p className="text-sm text-fg-muted">{e.description}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
    </UnverifiedContent>
  );
}

export function NewsPreview({ locale, dict }: { locale: Locale; dict: HomeDict["news"] }) {
  return (
    <UnverifiedContent section="home.news">
      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} link={{ href: localizePath(locale, "/noticias"), label: dict.link }} />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {NEWS.map((n) => (
              <li key={n.id} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                <div aria-hidden="true" className="hidden size-20 shrink-0 rounded-xl bg-surface-2 sm:block" />
                <div>
                  <p className="meta">{n.meta}</p>
                  <p className="mt-1 font-bold leading-snug">{n.title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{n.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </UnverifiedContent>
  );
}

export function PartnersStrip({ dict }: { dict: HomeDict["partners"] }) {
  return (
    <UnverifiedContent section="home.partners-strip">
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
          <ul className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6 opacity-80 grayscale">
            {PARTNER_LOGOS.map((l) => (
              <li key={l.id} className="rounded-lg bg-white p-2">
                <Image src={l.src} alt={l.name} width={120} height={48} className="h-8 w-auto object-contain" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </UnverifiedContent>
  );
}
