import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { HeroArt } from "@/components/public/HeroArt";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { ABOUT_COURSE_TEXT, COURSE_FACTS, PILLARS } from "@/content/staging";
import { hasDetail, LABS } from "@/data/labs";
import { CURRICULUMS, type CurriculumData } from "@/data/curriculums";
import { formatNumber } from "@/i18n/format";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type CourseDict = Dictionary["course"];

export function CourseHero({ dict }: { dict: CourseDict["hero"] }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:py-20">
        <div>
          <SectionHeading as="h1" eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row [&>a]:w-full sm:[&>a]:w-auto">
            <LinkButton href="#trajetoria" size="lg">
              {dict.primary}
            </LinkButton>
            <LinkButton href="/grades/grade2025.pdf" variant="secondary" size="lg">
              {dict.secondary}
            </LinkButton>
          </div>
        </div>
        <div className="overflow-hidden rounded-[32px] border border-line shadow-sm">
          <HeroArt title={dict.title} />
        </div>
      </div>
    </section>
  );
}

export function AboutCourse({ dict }: { dict: CourseDict["about"] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <UnverifiedContent section="curso.about">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <SectionHeading eyebrow={dict.eyebrow} title={dict.title} />
            <p className="mt-4 text-fg-muted">{ABOUT_COURSE_TEXT.text}</p>
          </div>
        </UnverifiedContent>
        <UnverifiedContent section="curso.facts">
          <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-link">{dict.facts}</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {COURSE_FACTS.map((f) => (
                <div key={f.id} className="rounded-xl border border-line bg-canvas p-4">
                  <dd className="text-xl font-black">{f.value}</dd>
                  <dt className="text-sm text-fg-muted">{f.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </UnverifiedContent>
      </div>
    </section>
  );
}

export function CoursePillarsSection({ dict }: { dict: CourseDict["pillars"] }) {
  return (
    <UnverifiedContent section="curso.pillars">
      <section id="frentes" className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li key={p.id} className="rounded-2xl border border-line bg-canvas p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">{p.meta}</p>
                <p className="mt-2 text-lg font-bold">{p.title}</p>
                <p className="mt-2 text-sm text-fg-muted">{p.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </UnverifiedContent>
  );
}

function summarize(curriculum: CurriculumData) {
  return curriculum.phases.map((p) => ({
    phase: p.phase,
    subjects: p.subjects.length,
    hours: p.subjects.reduce((a, s) => a + s.hours, 0),
    railway: p.subjects.filter((s) => s.cat === "railway").length,
    highlights: p.subjects.filter((s) => s.cat === "railway").map((s) => s.name),
  }));
}

/** Trajetória por fase, derivada do dataset curricular (fonte canônica em FLOW-001). */
export function CourseJourney({ locale, dict }: { locale: Locale; dict: CourseDict["journey"] }) {
  const current = CURRICULUMS[0];
  const phases = summarize(current);
  return (
    <UnverifiedContent section="curso.curriculum">
      <section id="trajetoria" className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} link={{ href: "#fluxograma", label: dict.flowchart }} />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {phases.map((p) => (
              <li key={p.phase} className="relative rounded-2xl border border-line bg-surface p-5">
                <span aria-hidden="true" className="absolute -top-2 left-5 h-1 w-10 rounded-full bg-action" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                  {dict.phase} {p.phase}
                </p>
                <p className="mt-1 text-2xl font-black">
                  {p.subjects} <span className="text-sm font-bold text-fg-muted">{dict.subjects}</span>
                </p>
                <p className="text-sm text-fg-muted">
                  {formatNumber(locale, p.hours)} {dict.hours} · {p.railway} {dict.railway}
                </p>
                {p.highlights.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {p.highlights.map((h) => (
                      <li key={h}>
                        <Badge tone="info">{h}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="w-full text-sm font-bold text-fg-muted sm:w-auto">{dict.downloads}:</span>
            {CURRICULUMS.map((c) => (
              <LinkButton key={c.id} href={`/grades/grade${c.year}.pdf`} variant="secondary" size="sm">
                {dict.grade} {c.year}
              </LinkButton>
            ))}
          </div>
        </div>
      </section>
    </UnverifiedContent>
  );
}

export function CourseLabs({ dict, locale, allLabel }: { dict: CourseDict["labs"]; locale: Locale; allLabel: string }) {
  return (
    <UnverifiedContent section="curso.labs">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LABS.map((lab) => (
              <li key={lab.id}>
                <Link
                  href={localizePath(locale, `/laboratorios/${lab.id}`)}
                  className="flex h-full items-start gap-4 rounded-2xl border border-line bg-canvas p-5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="inline-flex min-w-16 justify-center rounded-lg border border-line bg-surface px-2 py-1 text-xs font-black text-link">{lab.acronym}</span>
                  <span>
                    <span className="block font-bold leading-snug">{lab.name}</span>
                    {!hasDetail(lab) && <span className="mt-1 block text-xs text-fg-muted">{dict.pendingDetail}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <LinkButton href={localizePath(locale, "/laboratorios")} variant="secondary">
              {allLabel}
            </LinkButton>
          </div>
        </div>
      </section>
    </UnverifiedContent>
  );
}

export function CourseCta({ dict }: { dict: CourseDict["cta"] }) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-[32px] border border-accent/30 bg-accent/5 p-6 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{dict.title}</h2>
            <p className="mt-2 text-lg text-fg-muted">{dict.description}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto [&>a]:w-full sm:[&>a]:w-auto">
            <LinkButton href="#trajetoria">{dict.primary}</LinkButton>
            <LinkButton href="/portal" variant="secondary">
              {dict.secondary}
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
