import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { CAPABILITY_IDS, labsWithCapability } from "@/data/capabilities";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/para-empresas";

export async function generateMetadata({ params }: PageProps<"/[locale]/para-empresas">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.companies);
}

/**
 * Para Empresas (04/13): começa pelo problema técnico e aponta capacidades/labs,
 * não logos. "Enviar desafio" leva ao formulário protegido (CRM-001);
 * confidencialidade explicada sem prometer NDA; modalidades pendentes.
 */
export default async function ParaEmpresasPage({ params }: PageProps<"/[locale]/para-empresas">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage dict={dict} path={PATH} />;
  const c = dict.companies;

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={c.eyebrow} title={c.title} description={c.description} />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-12 sm:px-6">
        <section aria-labelledby="empresas-como">
          <h2 id="empresas-como" className="text-xs font-bold uppercase tracking-[0.2em] text-action">{c.stepsTitle}</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {c.steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-line bg-surface p-5">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-action text-sm font-black text-fg-on-action" aria-hidden="true">
                  {i + 1}
                </span>
                <p className="mt-3 font-bold">{s.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{s.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="empresas-areas">
          <h2 id="empresas-areas" className="text-xs font-bold uppercase tracking-[0.2em] text-action">{c.capabilitiesTitle}</h2>
          <UnverifiedContent section="empresas.capacidades">
            <ul className="mt-4 grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      className="flex h-full flex-col gap-1 rounded-2xl border border-line bg-surface p-4 hover:border-line-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <span className="font-bold">{dict.capabilities[id]}</span>
                      <span className="text-xs text-fg-muted">{parts.length === 0 ? c.noLabs : parts.join(" · ")}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </UnverifiedContent>
          <div className="mt-6">
            <LinkButton href={localizePath(l, "/laboratorios")} variant="secondary">
              {c.seeLabs}
            </LinkButton>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <h2 className="font-bold">{c.submitTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{c.submitDescription}</p>
            <div className="mt-4">
              <LinkButton href={localizePath(l, "/para-empresas/desafio")}>{c.submitButton}</LinkButton>
            </div>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-bold">{c.confidentialityTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{c.confidentialityText}</p>
          </section>
          <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
            <h2 className="font-bold">{c.modalitiesTitle}</h2>
            <p className="mt-1 text-sm text-fg-muted">{c.modalitiesText}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
