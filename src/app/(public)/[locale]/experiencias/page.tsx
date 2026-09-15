import type { Metadata } from "next";
import Link from "next/link";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EXPERIENCES } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/experiencias";
const SCOPES = ["all", "brasil", "internacional"] as const;
type Scope = (typeof SCOPES)[number];

export async function generateMetadata({ params }: PageProps<"/[locale]/experiencias">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.visits);
}

/** Datas do staging: "2023" (passada) ou "jul 2026" (futura, relativo ao ano de extração 2026). */
function isUpcoming(when: string): boolean {
  return /2026|2027/.test(when);
}

/**
 * Hub de Experiências (04, guia §9): filtro Brasil/Internacional como estado
 * de URL (compartilhável, sem JS obrigatório), linha do tempo de realizadas e
 * próximas, e bloco de inscrição honesto (sem período aberto = explicar).
 * Conteúdo do staging sob quarentena; sem mapa até haver dados com coordenadas.
 */
export default async function ExperienciasPage({ params, searchParams }: PageProps<"/[locale]/experiencias">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);
  const sp = await searchParams;
  const scope: Scope = SCOPES.includes(sp.escopo as Scope) ? (sp.escopo as Scope) : "all";

  const items = EXPERIENCES.filter((e) => scope === "all" || e.scope === scope);
  const past = items.filter((e) => !isUpcoming(e.when));
  const upcoming = items.filter((e) => isUpcoming(e.when));
  const labelOf = (s: Scope) => (s === "all" ? dict.experiences.all : s === "brasil" ? dict.experiences.brazil : dict.experiences.international);

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.experiences.eyebrow} title={dict.experiences.title} description={dict.experiences.description} />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6">
        <nav aria-label={dict.experiences.filterLabel} className="flex flex-wrap items-center gap-2">
          {SCOPES.map((s) => (
            <Link
              key={s}
              href={s === "all" ? localizePath(l, PATH) : `${localizePath(l, PATH)}?escopo=${s}`}
              aria-current={scope === s ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                scope === s ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"
              }`}
            >
              {labelOf(s)}
            </Link>
          ))}
          <span className="ml-auto text-sm text-fg-muted" aria-live="polite">
            {dict.experiences.results.replace("{count}", String(items.length))}
          </span>
        </nav>

        {items.length === 0 ? (
          <EmptyState title={dict.experiences.empty} description="" />
        ) : (
          <UnverifiedContent section="experiencias.hub">
            <div className="grid gap-8 lg:grid-cols-2">
              {[
                { key: "past", label: dict.experiences.past, list: past },
                { key: "upcoming", label: dict.experiences.upcoming, list: upcoming },
              ].map((g) => (
                <section key={g.key} className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{g.label}</h2>
                  {g.list.length === 0 ? (
                    <p className="mt-3 text-sm text-fg-muted">{dict.experiences.empty}</p>
                  ) : (
                    <ol className="mt-4 border-l-2 border-line pl-5">
                      {g.list.map((e) => (
                        <li key={e.id} className="relative pb-6 last:pb-0">
                          <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface bg-action" />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{e.when}</span>
                            <Badge tone={e.scope === "internacional" ? "info" : "neutral"}>{e.scope === "internacional" ? dict.experiences.international : dict.experiences.brazil}</Badge>
                          </div>
                          <p className="mt-1 font-bold">{e.title}</p>
                          <p className="text-sm text-fg-muted">{e.meta}</p>
                          <p className="mt-1 text-sm text-fg-muted">{e.description}</p>
                          <Link
                            href={localizePath(l, `/experiencias/${e.id}`)}
                            className="mt-2 inline-flex items-center gap-1 rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            {dict.experiences.detail} <span aria-hidden="true">→</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              ))}
            </div>
          </UnverifiedContent>
        )}

        <section className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
          <h2 className="font-bold">{dict.experiences.registrationTitle}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.experiences.registrationClosed}</p>
        </section>
      </div>
    </div>
  );
}
