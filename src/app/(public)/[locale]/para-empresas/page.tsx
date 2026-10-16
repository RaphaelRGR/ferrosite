import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { PendingPage } from "@/components/editorial/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { CAPABILITY_IDS, capabilitiesOf, labsWithCapability } from "@/content/capabilities";
import { hasDetail, LABS, splitAbout } from "@/content/labs";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/para-empresas";

export async function generateMetadata({ params }: PageProps<"/[locale]/para-empresas">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.companies);
}

const STRETCHED_LINK =
  "inline-flex w-fit items-center gap-1 rounded text-sm font-bold text-link underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

/**
 * Para Empresas (04/13, DESIGN-D): percurso desafio → capacidade → laboratório → equipamento, só com o
 * portfólio verificado. "Enviar desafio" leva ao formulário protegido (CRM-001); confidencialidade sem
 * prometer NDA; modalidades continuam pendentes até haver texto institucional.
 */
export default async function ParaEmpresasPage({ params }: PageProps<"/[locale]/para-empresas">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage dict={dict} path={PATH} />;
  const c = dict.companies;
  const challenge = localizePath(l, "/para-empresas/desafio");
  // destaque objetivo: os laboratórios com mais capacidades descritas ("offered") no portfólio
  const featured = LABS.filter(hasDetail)
    .map((lab) => ({ lab, offered: capabilitiesOf(lab.id).filter((x) => x.level === "offered").length, infra: splitAbout(lab).infrastructure[0] }))
    .filter((x) => x.infra)
    .sort((a, b) => b.offered - a.offered)
    .slice(0, 4);

  return (
    <>
      <section className="section-regular bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <SectionHeading as="h1" eyebrow={c.eyebrow} title={c.title} description={c.description} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-4 lg:justify-end">
            <LinkButton href={challenge} size="lg">
              {c.submitButton} <span aria-hidden="true">→</span>
            </LinkButton>
            <Link href={localizePath(l, "/laboratorios")} className="inline-flex min-h-11 items-center gap-1 rounded font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              {c.seeLabs} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona: três passos sobre um trilho (a sequência é a informação). */}
      <section aria-labelledby="empresas-como" className="section-compact bg-canvas">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="empresas-como" className="t-subsection font-black">
            {c.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10" data-reveal-group>
            {c.steps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col gap-2 border-t-2 border-line pt-6">
                <span aria-hidden="true" className="absolute -top-[13px] left-0 inline-flex size-6 items-center justify-center rounded-full bg-action text-xs font-black text-fg-on-action">
                  {i + 1}
                </span>
                <p className="text-lg font-bold">{step.title}</p>
                <p className="text-fg-muted">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="empresas-areas" className="section-regular bg-canvas pt-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 id="empresas-areas" className="t-section font-black">
            {c.capabilitiesTitle}
          </h2>
          <UnverifiedContent section="empresas.capacidades">
            <ul className="mt-8 grid gap-x-10 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {CAPABILITY_IDS.map((id) => {
                const labs = labsWithCapability(id);
                const offered = labs.filter((x) => x.level === "offered").length;
                const prospective = labs.filter((x) => x.level === "prospective").length;
                const pending = labs.filter((x) => x.level === "pending").length;
                const parts: string[] = [];
                if (offered + prospective > 0) parts.push(c.labsCount.replace("{offered}", String(offered)).replace("{prospective}", String(prospective)));
                if (pending > 0) parts.push(c.labsCountPending.replace("{pending}", String(pending)));
                return (
                  <li key={id}>
                    <Link
                      href={`${localizePath(l, "/laboratorios")}?capacidade=${id}`}
                      className="group flex h-full flex-col gap-1 border-b border-line py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <span className="f-display text-xl font-black group-hover:text-link">{dict.capabilities[id]}</span>
                      <span className="text-sm text-fg-muted">{parts.length === 0 ? c.noLabs : parts.join(" · ")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </UnverifiedContent>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="empresas-labs" className="section-regular bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading title={c.featuredLabsTitle} description={c.featuredLabsDescription} link={{ href: localizePath(l, "/laboratorios"), label: c.seeLabs }} />
            <UnverifiedContent section="laboratorios.hub">
              <ul className="mt-10 grid gap-10 md:grid-cols-2" data-reveal-group>
                {featured.map(({ lab, infra }) => (
                  <li key={lab.id} className="group relative flex flex-col gap-3 border-t-2 border-action pt-6">
                    <p className="f-display text-4xl font-black leading-none text-link">{lab.acronym}</p>
                    <h3 className="text-xl font-bold leading-snug">{lab.name}</h3>
                    <p className="max-w-[60ch] text-fg-muted">{infra}</p>
                    <Link
                      href={localizePath(l, `/laboratorios/${lab.id}`)}
                      className={STRETCHED_LINK}
                    >
                      {dict.labs.detail} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </UnverifiedContent>
          </div>
        </section>
      )}

      <section className="section-regular bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <section className="flex flex-col items-start gap-4 rounded-2xl bg-[var(--board-bg)] p-8 text-[var(--board-fg)] sm:p-10 lg:col-span-6">
            <h2 className="t-subsection font-black">{c.submitTitle}</h2>
            <p className="max-w-[55ch] text-[var(--board-muted)]">{c.submitDescription}</p>
            <LinkButton href={challenge}>{c.submitButton}</LinkButton>
          </section>
          <div className="flex flex-col gap-8 lg:col-span-6">
            <section>
              <h2 className="text-xl font-bold">{c.confidentialityTitle}</h2>
              <p className="mt-2 max-w-[60ch] text-fg-muted">{c.confidentialityText}</p>
            </section>
            <section className="rounded-2xl border border-dashed border-line-strong p-6">
              <h2 className="text-xl font-bold">{c.modalitiesTitle}</h2>
              <p className="mt-2 max-w-[60ch] text-fg-muted">{c.modalitiesText}</p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
