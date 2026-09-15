import { Navbar } from "@/components/layout/Navbar";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Shell do site público: skip link, Navbar, único <main> e footer.
 * Usado pelo layout de (public)/[locale] e pela not-found localizada.
 * Strings vêm do catálogo do locale; nada de texto hard-coded aqui.
 */
export function PublicShell({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas text-fg selection:bg-accent selection:text-fg-on-action">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
      >
        {dict.a11y.skipToContent}
      </a>

      <Navbar
        locale={locale}
        labels={{
          site: dict.site,
          a11y: dict.a11y,
          nav: dict.nav,
          locale: dict.locale,
        }}
        homeHref={localizePath(locale, "/")}
      />

      <main id="conteudo" className="min-h-screen">
        {children}
      </main>

      <footer className="w-full bg-[#050505] border-t border-white/5 text-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-8 sm:gap-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
            <BrandLogo width={140} />
            <div>
              <p className="font-black text-lg sm:text-xl text-white mb-2 sm:mb-3">{dict.footer.title}</p>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">{dict.footer.campus}</p>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">{dict.footer.center}</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-white/30 sm:text-right font-medium tracking-wide flex flex-col sm:justify-end gap-1">
            <p>{dict.footer.portal}</p>
            <p>
              © {new Date().getFullYear()} {dict.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
