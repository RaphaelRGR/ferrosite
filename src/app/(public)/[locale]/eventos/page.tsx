import type { Metadata } from "next";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/eventos";

export async function generateMetadata({ params }: PageProps<"/[locale]/eventos">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.events);
}

/**
 * Eventos (04): "não publicar os eventos 2026 atuais até validação" — a agenda
 * nasce vazia e honesta (sem filtros/inscrições falsos). Os eventos do protótipo
 * permanecem só no inventário. Competições e congressos entram por Experiências.
 */
export default async function EventosPage({ params }: PageProps<"/[locale]/eventos">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);

  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.events.eyebrow} title={dict.events.title} description={dict.events.description} />
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title={dict.events.emptyTitle}
          description={dict.events.emptyDescription}
          action={
            <LinkButton href={localizePath(l, "/experiencias")} variant="secondary">
              {dict.events.goToExperiences}
            </LinkButton>
          }
        />
      </div>
    </div>
  );
}
