import Image from "next/image";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { HeroArt } from "@/components/public/HeroArt";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { EXPERIENCES, FEATURED_PROJECTS, INDICATORS, NEWS, PARTNER_LOGOS } from "@/content/staging";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import type { PublicProject, PublishedItem } from "@/lib/content/public";
import { ProjectCards } from "@/components/public/ProjectCards";

type HomeDict = Dictionary["home"];

const ICON = {
  infra: "M4 19h16M6 15l2-10h8l2 10M9 15V5M15 15V5",
  rolling: "M5 16V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9M4 16h16M7 20l-2 2M17 20l2 2M8 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  signalling: "M12 3v18M8 7h8M8 12h8M9 17h6M12 3a2 2 0 0 0-2 2M12 3a2 2 0 0 1 2 2",
  operations: "M3 12h18M3 6h18M3 18h18M7 3v3M17 15v3",
} as const;

export function HomeHero({ locale, dict, hero = null }: { locale: Locale; dict: HomeDict["hero"]; hero?: { url: string; alt: string; credit: string } | null }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="hero-in">
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
            <span aria-hidden="true" className="h-0.5 w-6 rounded-full bg-action" />
            {dict.eyebrow}
          </p>
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
            {dict.title.split(" & ")[0]} <span className="text-accent">&amp;</span> {dict.title.split(" & ")[1]}
            <span className="mt-2 block text-2xl font-bold text-fg-muted sm:text-3xl">{dict.subtitle}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-fg-muted">{dict.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={localizePath(locale, "/curso")} size="lg">
              {dict.primary} <span aria-hidden="true">→</span>
            </LinkButton>
            <LinkButton href={localizePath(locale, "/projetos")} variant="secondary" size="lg">
              {dict.secondary}
            </LinkButton>
          </div>
        </div>
        <figure className="relative">
          <div className="hero-media overflow-hidden rounded-[32px] border border-line shadow-sm">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia), sem otimização externa
              <img src={hero.url} alt={hero.alt} className="aspect-[10/7] w-full object-cover" fetchPriority="high" />
            ) : (
              <HeroArt title={dict.artAlt} />
            )}
          </div>
          <figcaption className="mt-2 text-right text-xs text-fg-muted">{hero ? (hero.credit ? `${dict.photoCredit}: ${hero.credit}` : hero.alt) : dict.artNote}</figcaption>
        </figure>
      </div>
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
                <p className="text-2xl font-black tracking-tight">{i.value}</p>
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

export function CourseFronts({ locale, dict }: { locale: Locale; dict: HomeDict["fronts"] }) {
  const items = (["infra", "rolling", "signalling", "operations"] as const).map((key) => ({ key, ...dict.items[key] }));
  // Em EN a página do curso está pendente e não tem a âncora.
  const target = localizePath(locale, "/curso") + (locale === "pt" ? "#frentes" : "");
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} link={{ href: target, label: dict.link }} />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-group>
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={target}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-canvas p-6 transition-colors hover:border-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent/10 text-link">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                    <path d={ICON[item.key]} />
                  </svg>
                </span>
                <span className="text-lg font-bold">{item.title}</span>
                <span className="text-sm text-fg-muted">{item.description}</span>
                <span aria-hidden="true" className="mt-auto text-link transition-transform group-hover:translate-x-1">→</span>
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
      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} link={{ href: localizePath(locale, "/projetos"), label: dict.link }} />
          <div className="mt-10">
            <ProjectCards projects={projects.slice(0, 8)} covers={covers} locale={locale} dict={fullDict} detailLabel={dict.detail} columns={4} />
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

export function PublishedExperiences({ locale, dict, items, covers }: { locale: Locale; dict: HomeDict["experiences"]; items: PublishedItem[]; covers: Map<string, string> }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-surface" data-published="live">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.publishedTitle} link={{ href: localizePath(locale, "/experiencias"), label: dict.link }} />
        <ul className="mt-10 grid gap-5 md:grid-cols-3" data-reveal-group>
          {items.slice(0, 6).map((e) => (
            <li key={e.id} className="card-lift relative flex flex-col overflow-hidden rounded-2xl border border-line bg-canvas">
              <div className="zoom-media">
                {covers.get(e.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- proxy próprio (/api/midia)
                  <img src={covers.get(e.id)} alt={e.cover_alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div aria-hidden="true" className="aspect-[4/3] w-full bg-gradient-to-br from-surface-2 to-canvas" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
                  {e.event_at && <time dateTime={e.event_at}>{formatDate(locale, new Date(e.event_at), { dateStyle: "medium" })}</time>}
                  {e.event_place && ` · ${e.event_place}`}
                </p>
                <h3 className="font-bold leading-snug">
                  {/* Link esticado: título, imagem e cartão inteiro levam à experiência (um único destino por cartão). */}
                  <Link href={localizePath(locale, `/experiencias/${e.slug}`)} className="rounded after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    {e.title}
                  </Link>
                </h3>
                <p className="text-sm text-fg-muted">{e.summary}</p>
                <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-link">
                  {dict.detail} <span>→</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
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
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-link">{g.label}</h3>
                <ol className="mt-4 border-l-2 border-line pl-5">
                  {g.items.map((e) => (
                    <li key={e.id} className="relative pb-5 last:pb-0">
                      <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface bg-action" />
                      <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
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
                  <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">{n.meta}</p>
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

export function FinalCta({ locale, dict }: { locale: Locale; dict: HomeDict["cta"] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-[32px] border border-accent/30 bg-accent/5 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{dict.title}</h2>
            <p className="mt-2 text-lg text-fg-muted">{dict.description}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <LinkButton href={localizePath(locale, "/curso")}>{dict.student}</LinkButton>
            <LinkButton href={localizePath(locale, "/noticias")} variant="secondary">
              {dict.community}
            </LinkButton>
            <LinkButton href="/portal" variant="ghost">
              {dict.portal}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
