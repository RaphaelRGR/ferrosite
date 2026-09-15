import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HtmlShell } from "@/components/layout/HtmlShell";
import { PublicShell } from "@/components/layout/PublicShell";
import { hasLocale, LOCALE_TAGS, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localeAlternates, SITE_URL } from "@/i18n/metadata";

/**
 * Root layout do site público, sob `[locale]` (24: locale explícito; 23: `lang`
 * por locale). Tema escuro no <html> é o visual atual do site (PUBLIC-001 migra
 * para claro). Portal e catálogo têm root layouts próprios (ARCH-001).
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: SITE_URL,
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
    alternates: localeAlternates(locale, "/"),
  };
}

export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // O proxy já redireciona prefixos desconhecidos; isto só cobre acesso direto sem proxy.
  if (!hasLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <HtmlShell lang={LOCALE_TAGS[locale]} theme="dark">
      <PublicShell locale={locale} dict={dict}>
        {children}
      </PublicShell>
    </HtmlShell>
  );
}
