"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Drawer } from "@/components/ui/Drawer";
import { localizePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export interface PublicHeaderLabels {
  site: Dictionary["site"];
  a11y: Dictionary["a11y"];
  nav: Dictionary["nav"];
  locale: Dictionary["locale"];
}

/**
 * Header claro do site público (guia §5, referências): logo oficial + marca em
 * texto, navegação primária curta, PT|EN e botão Portal. No mobile, drawer
 * acessível. Só rotas existentes entram no menu (03).
 */
export function PublicHeader({ locale, labels }: { locale: Locale; labels: PublicHeaderLabels }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { name: labels.nav.home, href: localizePath(locale, "/") },
    { name: labels.nav.course, href: localizePath(locale, "/curso") },
    { name: labels.nav.projects, href: localizePath(locale, "/projetos") },
    { name: labels.nav.experiences, href: localizePath(locale, "/experiencias") },
    { name: labels.nav.news, href: localizePath(locale, "/noticias") },
    { name: labels.nav.companies, href: localizePath(locale, "/para-empresas") },
  ];
  const isActive = (href: string) => (href === localizePath(locale, "/") ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const linkClass = (href: string) =>
    `relative rounded px-1 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
      isActive(href) ? "text-link" : "text-fg-muted hover:text-fg"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={localizePath(locale, "/")}
          data-brand-logo
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <BrandLogo width={52} className="p-0.5" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-black tracking-tight sm:text-base">{labels.site.brandLine1}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-muted">{labels.site.campus}</span>
          </span>
        </Link>

        <nav aria-label={labels.a11y.mainNavigation} className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className={`link-rail ${linkClass(l.href)}`}>
              {l.name}
              {isActive(l.href) && <span aria-hidden="true" className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-action" />}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LocaleSwitcher current={locale} labels={labels.locale} ariaLabel={labels.a11y.languageSelector} tone="light" />
          <Link
            href="/portal"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-bold text-fg-on-action transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {labels.nav.portal}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
            </svg>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={labels.a11y.openMenu}
          aria-haspopup="dialog"
          className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title={labels.a11y.mainNavigation} side="right">
        <div className="flex items-center justify-between border-b border-line p-4">
          <BrandLogo width={56} className="p-1" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.a11y.closeMenu}
            className="inline-flex size-11 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <nav aria-label={labels.a11y.mainNavigation} className="flex flex-col gap-1 p-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-3 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                isActive(l.href) ? "bg-surface-2 text-link" : "text-fg hover:bg-surface-2"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4 border-t border-line p-4">
          <LocaleSwitcher current={locale} labels={labels.locale} ariaLabel={labels.a11y.languageSelector} tone="light" />
          <Link
            href="/portal"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-action px-5 text-sm font-bold text-fg-on-action hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {labels.nav.portalLong}
          </Link>
        </div>
      </Drawer>
    </header>
  );
}
