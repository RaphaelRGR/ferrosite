import type { Metadata } from "next";
import { PendingPage } from "@/components/layout/PendingContent";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";
/**
 * Página de Simuladores
 * Apresenta as ferramentas e simuladores disponíveis.
 */

const PATH = "/simuladores";

export async function generateMetadata({ params }: PageProps<"/[locale]/simuladores">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return publicPageMetadata(l, PATH, getDictionary(l).pages.simulators);
}

export default async function SimuladoresPage({ params }: PageProps<"/[locale]/simuladores">) {
  const { locale } = await params;
  // Conteúdo editorial desta página só existe em PT (BASE-002/PUBLIC-*): EN mostra indisponibilidade explícita.
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  if (l !== "pt") return <PendingPage locale={l} dict={getDictionary(l)} path={PATH} />;

  return (
    <div>
      <h1>Simuladores</h1>
      {/* TODO: Implementar conteúdo da página */}
    </div>
  );
}
