"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_TAGS, LOCALES, localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Seletor PT/EN. Preserva rota, query e fragmento; grava a escolha em cookie
 * para o proxy respeitar em visitas seguintes (24: não redirecionar por
 * navegador depois que o usuário escolheu).
 */
export function LocaleSwitcher({
  current,
  labels,
  ariaLabel,
}: {
  current: Locale;
  labels: Dictionary["locale"];
  ariaLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const choose = (locale: Locale, href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.push(href + window.location.search + window.location.hash);
  };

  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em]">
      {LOCALES.map((locale, index) => {
        const href = localizePath(locale, pathname);
        const active = locale === current;
        return (
          <span key={locale} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true" className="text-white/20">/</span>}
            <a
              href={href}
              hrefLang={LOCALE_TAGS[locale]}
              lang={LOCALE_TAGS[locale]}
              aria-current={active ? "true" : undefined}
              onClick={choose(locale, href)}
              className={`rounded px-1.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                active ? "text-[#E84E1B]" : "text-white/60 hover:text-white"
              }`}
            >
              <span aria-hidden="true">{locale === "pt" ? labels.ptShort : labels.enShort}</span>
              <span className="sr-only">{locale === "pt" ? labels.pt : labels.en}</span>
            </a>
          </span>
        );
      })}
    </nav>
  );
}
