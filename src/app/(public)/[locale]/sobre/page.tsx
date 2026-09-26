import type { Metadata } from "next";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage, EditorialPending } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { HISTORY, IDENTITY, RESEARCH_LINES } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
import { isSectionVisible } from "@/content/quarantine";

const PATH = "/sobre";

export async function generateMetadata({ params }: PageProps<"/[locale]/sobre">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.about);
}

/**
 * Sobre: linha do tempo (sem nomes de pessoas), identidade e linhas de
 * pesquisa — tudo do staging, sob quarentena, em layout claro.
 */
export default async function SobrePage({ params }: PageProps<"/[locale]/sobre">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);
  const sections = ["sobre.historia", "sobre.identidade", "sobre.pesquisa"];
  const anyVisible = sections.some((id) => isSectionVisible(id));

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.about.eyebrow} title={dict.about.title} description={dict.about.description} />
        </div>
      </section>

      {!anyVisible && <EditorialPending dict={dict} />}
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6">
        <UnverifiedContent section="sobre.historia">
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{dict.about.history}</h2>
            <ol className="mt-4 border-l-2 border-line pl-5">
              {HISTORY.map((h) => (
                <li key={h.id} className="relative pb-6 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-surface bg-action" />
                  <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">{h.when}</p>
                  <p className="font-bold">{h.title}</p>
                  <p className="text-sm text-fg-muted">{h.description}</p>
                </li>
              ))}
            </ol>
          </section>
        </UnverifiedContent>

        <UnverifiedContent section="sobre.identidade">
          <section className="grid gap-4 md:grid-cols-3">
            {IDENTITY.map((i) => (
              <div key={i.id} className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-action">{i.meta}</p>
                <h2 className="mt-1 text-lg font-bold">{i.title}</h2>
                <p className="mt-2 text-sm text-fg-muted">{i.description}</p>
              </div>
            ))}
          </section>
        </UnverifiedContent>

        <UnverifiedContent section="sobre.pesquisa">
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-action">{dict.about.research}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {RESEARCH_LINES.map((r) => (
                <li key={r.id} className="rounded-xl border border-line bg-canvas p-4">
                  <p className="font-bold">{r.title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{r.description}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-fg-muted">{dict.about.researchNote}</p>
          </section>
        </UnverifiedContent>
      </div>
    </div>
  );
}
