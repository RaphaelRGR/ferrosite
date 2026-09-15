import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { LabCard } from "@/components/public/labs/LabCard";
import { SectionHeading } from "@/components/public/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { CAPABILITY_IDS, capabilitiesOf, isCapabilityId } from "@/data/capabilities";
import { LABS } from "@/data/labs";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/laboratorios";

export async function generateMetadata({ params }: PageProps<"/[locale]/laboratorios">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.labs);
}

/**
 * Hub de laboratórios (04 "P&D e laboratórios", 14): navegação por capacidade
 * como estado de URL (?capacidade=), sem JS obrigatório. A relação
 * lab↔capacidade é administrada (src/data/capabilities.ts), não busca textual.
 * Conteúdo do portfólio sob quarentena até validação institucional.
 */
export default async function LaboratoriosPage({ params, searchParams }: PageProps<"/[locale]/laboratorios">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage dict={dict} path={PATH} />;
  const sp = await searchParams;
  const capability = isCapabilityId(sp.capacidade) ? sp.capacidade : null;

  const items = capability ? LABS.filter((lab) => capabilitiesOf(lab.id).some((c) => c.capability === capability)) : LABS;
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
      active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"
    }`;

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.labs.eyebrow} title={dict.labs.title} description={dict.labs.description} />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6">
        <nav aria-label={dict.labs.filterLabel} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={localizePath(l, PATH)} aria-current={capability === null ? "page" : undefined} className={chip(capability === null)}>
              {dict.labs.all}
            </Link>
            {CAPABILITY_IDS.map((id) => (
              <Link key={id} href={`${localizePath(l, PATH)}?capacidade=${id}`} aria-current={capability === id ? "page" : undefined} className={chip(capability === id)}>
                {dict.capabilities[id]}
              </Link>
            ))}
          </div>
          <p className="text-sm text-fg-muted" aria-live="polite">
            {dict.labs.results.replace("{count}", String(items.length))}
          </p>
          <p className="text-xs text-fg-muted">
            <span aria-hidden="true">* </span>
            {dict.labs.prospectiveNote}
          </p>
        </nav>

        {items.length === 0 ? (
          <EmptyState
            title={dict.labs.empty}
            description=""
            action={
              <LinkButton href={localizePath(l, PATH)} variant="secondary">
                {dict.labs.all}
              </LinkButton>
            }
          />
        ) : (
          <UnverifiedContent section="laboratorios.hub">
            <ul className="grid gap-5 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((lab) => (
                <LabCard key={lab.id} lab={lab} locale={l} dict={dict.labs} capabilityNames={dict.capabilities} />
              ))}
            </ul>
          </UnverifiedContent>
        )}

        <section className="flex flex-col items-start gap-4 rounded-[32px] border border-accent/30 bg-accent/5 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{dict.labs.ctaTitle}</h2>
            <p className="mt-1 text-fg-muted">{dict.labs.ctaDescription}</p>
          </div>
          <LinkButton href={localizePath(l, "/para-empresas")}>{dict.labs.ctaButton}</LinkButton>
        </section>
      </div>
    </div>
  );
}
