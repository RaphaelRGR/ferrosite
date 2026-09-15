import type { Metadata } from "next";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/simuladores";

export async function generateMetadata({ params }: PageProps<"/[locale]/simuladores">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return { ...publicPageMetadata(l, PATH, getDictionary(l).pages.simulators), robots: { index: false, follow: true } };
}

/** Rota sem produto definido (33): mantida honesta e não indexada até a decisão. */
export default async function SimuladoresPage({ params }: PageProps<"/[locale]/simuladores">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage dict={getDictionary(l)} path={PATH} />;
  const dict = getDictionary(l);
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <SectionHeading as="h1" title={dict.simulators.title} description={dict.simulators.description} />
        <div className="mt-8">
          <LinkButton href={localizePath(l, "/")} variant="secondary">
            {dict.simulators.back}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
