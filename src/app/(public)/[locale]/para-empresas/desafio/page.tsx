import type { Metadata } from "next";
import { ChallengeForm } from "@/components/public/companies/ChallengeForm";
import { SectionHeading } from "@/components/public/SectionHeading";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/para-empresas/desafio";

export async function generateMetadata({ params }: PageProps<"/[locale]/para-empresas/desafio">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  return { ...publicPageMetadata(l, PATH, getDictionary(l).pages.challenge), robots: { index: false, follow: true } };
}

/**
 * "Tenho um desafio" (13): formulário real, protegido (validação, honeypot,
 * limite de envios, service role, auditoria) com confirmação por protocolo.
 * Disponível em PT e EN (é interface, não conteúdo editorial).
 */
export default async function DesafioPage({ params }: PageProps<"/[locale]/para-empresas/desafio">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  return (
    <div className="bg-canvas">
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <SectionHeading as="h1" eyebrow={dict.companies.eyebrow} title={dict.companies.form.title} description={dict.companies.form.description} />
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="relative rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <ChallengeForm dict={dict.companies.form} capabilityNames={dict.capabilities} locale={l} backHref={localizePath(l, "/para-empresas")} />
        </div>
      </div>
    </div>
  );
}
