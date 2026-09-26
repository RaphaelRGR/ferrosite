import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/editorial/UnverifiedContent";
import { PendingPage } from "@/components/editorial/PendingContent";
import { CapabilityBadge } from "@/components/public/labs/LabCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { capabilitiesOf } from "@/content/capabilities";
import { getLab, hasDetail, LABS } from "@/content/labs";
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

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-action";
const ITEM = "rounded-xl border border-line bg-surface px-4 py-3 text-sm";

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

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <UnverifiedContent section="laboratorios.detalhe">
            <div className="sm:pr-40">
              <span className="inline-flex rounded-lg border border-line bg-canvas px-2 py-1 text-xs font-black text-link">{lab.acronym}</span>
              <div className="mt-3">
                <SectionHeading as="h1" eyebrow={dict.labs.eyebrow} title={lab.name} description={detailed ? lab.about[0] : ""} />
              </div>
              {lab.responsible && (
                <p className="mt-4 text-sm text-fg-muted">
                  <span className="font-bold text-fg">{dict.labs.responsible}:</span> {lab.responsible}
                </p>
              )}
            </div>
          </UnverifiedContent>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-10">
          {detailed ? (
            <UnverifiedContent section="laboratorios.detalhe.conteudo" badgePosition="bottom-left">
              <div className="flex flex-col gap-10 pb-10">
                <section aria-labelledby="lab-about">
                  <h2 id="lab-about" className={H2}>{dict.labs.sectionAbout}</h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {lab.about.map((p) => (
                      <li key={p} className={ITEM}>{p}</li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="lab-history">
                  <h2 id="lab-history" className={H2}>{dict.labs.sectionHistory}</h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {lab.history.map((p) => (
                      <li key={p} className={ITEM}>{p}</li>
                    ))}
                  </ul>
                </section>
                <section aria-labelledby="lab-applications">
                  <h2 id="lab-applications" className={H2}>{dict.labs.sectionApplications}</h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {lab.applications.map((a) => (
                      <li key={a.text} className={`${ITEM} flex flex-col items-start gap-2`}>
                        {a.prospective && <Badge tone="neutral">{dict.labs.levelProspective}</Badge>}
                        <span>{a.text}</span>
                      </li>
                    ))}
                  </ul>
                  {lab.applications.some((a) => a.prospective) && <p className="mt-3 text-xs text-fg-muted">{dict.labs.prospectiveNote}</p>}
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

          <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
            <h2 className="font-bold">{dict.labs.pendingTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{dict.labs.pendingFields}</p>
            <p className="mt-2 text-sm text-fg-muted">{dict.labs.contactNote}</p>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className={H2}>{dict.labs.capabilities}</h2>
            {links.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{dict.labs.empty}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-1.5">
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
          <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <h2 className="font-black">{dict.labs.ctaTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{dict.labs.ctaDescription}</p>
            <div className="mt-4">
              <LinkButton href={localizePath(l, "/para-empresas")}>{dict.labs.ctaButton}</LinkButton>
            </div>
          </section>
          <p className="text-xs text-fg-muted">{dict.labs.source.replace("{page}", String(lab.page))}</p>
          <div>
            <LinkButton href={localizePath(l, "/laboratorios")} variant="secondary">
              ← {dict.labs.back}
            </LinkButton>
          </div>
        </aside>
      </div>
    </div>
  );
}
