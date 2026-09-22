import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { EasterEggs } from "@/components/public/motion/EasterEggs";
import { Locomotive } from "@/components/public/motion/Locomotive";
import { MotionProvider } from "@/components/public/motion/MotionProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Shell do site público (claro, editorial — 04/06): skip link, header, único
 * <main> e footer. Strings vêm do catálogo do locale.
 */
export function PublicShell({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const primary = [
    { name: dict.nav.home, href: localizePath(locale, "/") },
    { name: dict.nav.course, href: localizePath(locale, "/curso") },
    { name: dict.nav.projects, href: localizePath(locale, "/projetos") },
    { name: dict.nav.experiences, href: localizePath(locale, "/experiencias") },
    { name: dict.nav.news, href: localizePath(locale, "/noticias") },
    { name: dict.nav.companies, href: localizePath(locale, "/para-empresas") },
  ];
  // Rotas que existem mas ficaram fora do menu principal (decisão pendente em 33).
  const secondary = [
    { name: dict.nav.about, href: localizePath(locale, "/sobre") },
    { name: dict.nav.labs, href: localizePath(locale, "/laboratorios") },
    { name: dict.nav.events, href: localizePath(locale, "/eventos") },
    { name: dict.nav.simulators, href: localizePath(locale, "/simuladores") },
    { name: dict.nav.portal, href: "/portal" },
  ];
  const linkClass =
    "rounded text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg selection:bg-accent selection:text-fg-on-action">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
      >
        {dict.a11y.skipToContent}
      </a>

      <MotionProvider />
      <EasterEggs />
      <PublicHeader locale={locale} labels={{ site: dict.site, a11y: dict.a11y, nav: dict.nav, locale: dict.locale }} />

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-line bg-surface">
        {/* Celular: marca em cima e as duas listas lado a lado (evita uma coluna longa com metade da tela vazia). */}
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-[auto_1fr_1fr] md:gap-16">
          <div className="col-span-2 flex items-start gap-4 md:col-span-1">
            <BrandLogo width={72} className="shrink-0" />
            <div>
              <p className="font-black leading-tight">{dict.site.brandLine1}</p>
              <p className="text-sm text-fg-muted">{dict.footer.campus}</p>
              <p className="text-sm text-fg-muted">{dict.footer.center}</p>
            </div>
          </div>
          <nav aria-label={dict.footer.navLabel} className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{dict.footer.navLabel}</p>
            {primary.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.name}
              </Link>
            ))}
          </nav>
          <nav aria-label={dict.footer.moreLabel} className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{dict.footer.moreLabel}</p>
            {secondary.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 py-4 sm:px-6">
            <p className="text-xs text-fg-muted">
              © {new Date().getFullYear()} {dict.site.brandLine1}, {dict.site.campus}. {dict.footer.rights}
            </p>
            <Locomotive className="w-16 shrink-0 text-fg-muted sm:w-20" />
          </div>
        </div>
      </footer>
    </div>
  );
}
