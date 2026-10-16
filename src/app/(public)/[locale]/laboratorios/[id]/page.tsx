import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { PendingPage } from "@/components/editorial/PendingContent";
import { CapabilityBadge } from "@/components/public/labs/LabCard";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { capabilitiesOf } from "@/content/capabilities";
import { getLab, hasDetail, LABS, splitAbout } from "@/content/labs";
import { DEFAULT_LOCALE, hasLocale, LOCALES, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => LABS.map((lab) => ({ locale, id: lab.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/laboratorios/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const lab = getLab(id);
  if (!lab) return {};
  return publicPageMetadata(l, `/laboratorios/${id}`, { title: `${lab.acronym}: ${lab.name}`, description: lab.about[0] ?? getDictionary(l).pages.labs.description });
}

const H2 = "t-subsection font-black";

/** Lista de frases do portfólio, com o traço de trilho como marcador. */
function Facts({ items, children }: { items: string[]; children?: (item: string) => React.ReactNode }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.map((p) => (
        <li key={p} className="flex gap-3">
          <span aria-hidden="true" className="mt-3 h-0.5 w-4 shrink-0 rounded-full bg-action" />
          <div className="max-w-[68ch]">{children ? children(p) : p}</div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Página de laboratório (14): nome/sigla, responsável informado, "O laboratório",
 * "Histórico e projetos", aplicações (potencial distinguido de capacidade),
 * capacidades administradas, campos pendentes explícitos e CTA contextual.
 * Sem e-mail/telefone/sala (14/21). Página só-índice ou duplicada = pendência.
 */
export default async function LaboratorioPage({ params }: PageProps<"/[locale]/laboratorios/[id]">) {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const lab = getLab(id);
  if (!lab) notFound();
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage dict={dict} path={`/laboratorios/${id}`} />;
  const links = capabilitiesOf(lab.id);
  const duplicate = lab.duplicateOf ? getLab(lab.duplicateOf) : undefined;
  const detailed = hasDetail(lab);

  const { infrastructure, about } = splitAbout(lab);

  return (
    <>
      <section className="section-compact bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <UnverifiedContent section="laboratorios.detalhe">
            <div className="flex flex-col gap-4">
              <Link href={localizePath(l, "/laboratorios")} className="meta inline-flex w-fit items-center gap-1 rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <span aria-hidden="true">←</span> {dict.labs.back}
              </Link>
              <p className="f-display text-5xl font-black leading-none text-link sm:text-6xl">{lab.acronym}</p>
              <h1 className="t-title max-w-4xl font-black">{lab.name}</h1>
              {lab.responsible && (
                <p className="text-fg-muted">
                  <span className="font-bold text-fg">{dict.labs.responsible}:</span> {lab.responsible}
                </p>
              )}
            </div>
          </UnverifiedContent>
        </div>
      </section>

      <div className="section-regular mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <div className="flex flex-col gap-12 lg:col-span-8">
          {detailed ? (
            <UnverifiedContent section="laboratorios.detalhe.conteudo" badgePosition="bottom-left">
              <div className="flex flex-col gap-12 pb-10">
                {infrastructure.length > 0 && (
                  <section aria-labelledby="lab-infra" className="rounded-2xl bg-surface p-6 sm:p-8">
                    <h2 id="lab-infra" className={H2}>{dict.labs.sectionInfrastructure}</h2>
                    <Facts items={infrastructure} />
                  </section>
                )}
                {about.length > 0 && (
                  <section aria-labelledby="lab-about">
                    <h2 id="lab-about" className={H2}>{dict.labs.sectionAbout}</h2>
                    <Facts items={about} />
                  </section>
                )}
                <section aria-labelledby="lab-history">
                  <h2 id="lab-history" className={H2}>{dict.labs.sectionHistory}</h2>
                  <Facts items={lab.history} />
                </section>
                <section aria-labelledby="lab-applications">
                  <h2 id="lab-applications" className={H2}>{dict.labs.sectionApplications}</h2>
                  <Facts items={lab.applications.map((a) => a.text)}>
                    {(text) => (
                      <span className="flex flex-col items-start gap-2">
                        {lab.applications.find((a) => a.text === text)?.prospective && <Badge tone="neutral">{dict.labs.levelProspective}</Badge>}
                        <span>{text}</span>
                      </span>
                    )}
                  </Facts>
                  {lab.applications.some((a) => a.prospective) && <p className="mt-4 text-sm text-fg-muted">{dict.labs.prospectiveNote}</p>}
                </section>
              </div>
            </UnverifiedContent>
          ) : (
            <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
              <h2 className="font-bold">{dict.pending.title}</h2>
              <p className="mt-1 text-sm text-fg-muted">{duplicate ? dict.labs.duplicateNotice.replace("{lab}", duplicate.acronym) : dict.labs.indexOnly}</p>
              {duplicate && (
                <Link
                  href={localizePath(l, `/laboratorios/${duplicate.id}`)}
                  className="mt-3 inline-flex items-center gap-1 rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {dict.labs.duplicateLink.replace("{lab}", duplicate.acronym)} <span aria-hidden="true">→</span>
                </Link>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-dashed border-line-strong p-6">
            <h2 className="font-bold">{dict.labs.pendingTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{dict.labs.pendingFields}</p>
            <p className="mt-2 text-sm text-fg-muted">{dict.labs.contactNote}</p>
          </section>
        </div>

        <aside className="flex flex-col gap-8 lg:col-span-4">
          <section aria-labelledby="lab-caps">
            <h2 id="lab-caps" className={H2}>{dict.labs.capabilities}</h2>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{dict.labs.empty}</p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {links.map((c) => (
                  <li key={c.capability}>
                    <Link href={`${localizePath(l, "/laboratorios")}?capacidade=${c.capability}`} className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      <CapabilityBadge capability={c.capability} level={c.level} dict={dict.labs} capabilityNames={dict.capabilities} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="flex flex-col gap-3 rounded-2xl bg-[var(--board-bg)] p-6 text-[var(--board-fg)]">
            <h2 className="text-xl font-black">{dict.labs.ctaTitle}</h2>
            <p className="text-sm text-[var(--board-muted)]">{dict.labs.ctaDescription}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-3">
              <LinkButton href={localizePath(l, "/para-empresas/desafio")}>{dict.labs.proposeChallenge}</LinkButton>
              <Link href={localizePath(l, "/para-empresas")} className="rounded text-sm font-bold text-[var(--board-date)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--board-date)]">
                {dict.labs.ctaButton} →
              </Link>
            </div>
          </section>
          <p className="text-xs text-fg-muted">{dict.labs.source.replace("{page}", String(lab.page))}</p>
        </aside>
      </div>
    </>
  );
}
