import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { EasterEggs } from "@/components/public/motion/EasterEggs";
import { Locomotive } from "@/components/public/motion/Locomotive";
import { MotionProvider } from "@/components/public/motion/MotionProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { publicFont } from "./public-fonts";
import "./public-theme.css";

/**
 * Shell do site público (claro, editorial — 04/06): skip link, header, único
 * <main> e footer. Strings vêm do catálogo do locale. `data-site="public"` + a
 * fonte própria valem só aqui (DESIGN-D): o Portal não passa por este shell.
 */
export function PublicShell({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  const primary = [
    { name: dict.nav.home, href: localizePath(locale, "/") },
    { name: dict.nav.course, href: localizePath(locale, "/curso") },
    { name: dict.nav.projects, href: localizePath(locale, "/projetos") },
    { name: dict.nav.experiences, href: localizePath(locale, "/experiencias") },
    { name: dict.nav.calendar, href: localizePath(locale, "/calendario") },
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
    { name: dict.footer.privacy, href: localizePath(locale, "/privacidade") },
  ];
  const linkClass =
    "rounded py-1 text-[15px] text-fg-muted underline-offset-4 hover:text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

  return (
    <div data-site="public" className={`${publicFont.variable} flex min-h-screen flex-col bg-canvas text-fg selection:bg-accent selection:text-fg-on-action`}>
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

      {/* Rodapé como fechamento: o nome do curso grande, depois os caminhos e o crédito. */}
      <footer className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 border-b border-line py-12 sm:flex-row sm:items-end sm:justify-between sm:py-16">
            <div className="flex items-end gap-4 sm:gap-6">
              <BrandLogo width={72} className="hidden shrink-0 sm:block" />
              <div>
                <p className="t-title f-display font-black">{dict.site.brandLine1}</p>
                <p className="mt-2 text-fg-muted">
                  {dict.footer.campus} · {dict.footer.center}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-[1fr_1fr_auto] sm:gap-16">
            <nav aria-label={dict.footer.navLabel} className="flex flex-col gap-1">
              <p className="mb-1 text-sm font-bold text-fg">{dict.footer.navLabel}</p>
              {primary.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.name}
                </Link>
              ))}
            </nav>
            <nav aria-label={dict.footer.moreLabel} className="flex flex-col gap-1">
              <p className="mb-1 text-sm font-bold text-fg">{dict.footer.moreLabel}</p>
              {secondary.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass}>
                  {l.name}
                </Link>
              ))}
            </nav>
            <Locomotive className="col-span-2 w-20 self-end text-fg-muted sm:col-span-1 sm:w-24" />
          </div>
          <p className="border-t border-line py-5 text-xs text-fg-muted">
            © {new Date().getFullYear()} {dict.site.brandLine1}, {dict.site.campus}. {dict.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
