import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HtmlShell } from "@/components/layout/HtmlShell";
import { MobileNav } from "@/components/portal/MobileNav";
import { PortalNav } from "@/components/portal/PortalNav";
import { ThemeToggle } from "@/components/portal/ThemeToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/dictionaries";
import { signOut } from "@/lib/auth/actions";
import { getCurrentSession } from "@/lib/auth/session";
import { portalNavItems, visibleNavItems } from "@/lib/portal/navigation";
import { initialHtmlTheme, parseTheme, SYSTEM_THEME_SCRIPT, THEME_COOKIE } from "@/lib/portal/theme";
import { AccessGate } from "./AccessGate";

/**
 * Shell do Portal (05/08): sidebar no desktop, drawer no mobile, header com
 * tema/perfil/sair, um único <main>. Tema vem do cookie (aplicado no <html>
 * antes da hidratação; "sistema" resolvido por script inline). `lang` fixo em
 * pt-BR até a decisão sobre o escopo PT/EN do Portal (33).
 *
 * Gate (AUTH-002, fail-closed): o proxy já exige sessão; aqui exigimos perfil
 * ATIVO. A RLS é a última linha: nenhuma consulta abaixo depende só disto.
 */
export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Portal" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary("pt");
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/portal");

  const { user, profile } = session;
  const status = profile?.status ?? "pending";
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const items = visibleNavItems(portalNavItems(dict.portal), profile);
  const navLabels = { menu: dict.portal.nav.menu, open: dict.portal.nav.openMenu, close: dict.portal.nav.closeMenu };

  return (
    <HtmlShell lang="pt-BR" theme={initialHtmlTheme(theme)} themeScript={theme === "system" ? SYSTEM_THEME_SCRIPT : undefined}>
      <div className="flex min-h-screen bg-canvas text-fg">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
        >
          {dict.a11y.skipToContent}
        </a>

        {status === "active" && (
          <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
            <div className="p-5">
              <Link href="/portal" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <BrandLogo width={96} className="p-1" />
              </Link>
            </div>
            <div className="px-3">
              <PortalNav items={items} label={dict.portal.nav.menu} />
            </div>
            <p className="mt-auto p-5 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted">UFSC Joinville</p>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-line bg-surface">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                {status === "active" && <MobileNav items={items} labels={navLabels} />}
                <Link href="/portal" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
                  <BrandLogo width={44} className="p-0.5" />
                  {/* em telas estreitas o nome não cabe ao lado do seletor de tema e de Sair; o logo e o menu identificam o Portal */}
                  <span className="hidden text-sm font-black uppercase tracking-[0.12em] sm:inline">{dict.portal.name}</span>
                </Link>
                <span className="hidden text-sm font-black uppercase tracking-[0.12em] lg:inline">{dict.portal.name}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle initial={theme} labels={dict.portal.theme} />
                <span className="hidden max-w-[16rem] truncate text-xs text-fg-muted md:inline" title={user.email ?? undefined}>
                  {profile?.full_name || user.email}
                  {profile && <> · {dict.portal.roles[profile.global_role]}</>}
                </span>
                <Link
                  href="/pt"
                  className="hidden rounded text-xs font-bold uppercase tracking-widest text-fg-muted underline-offset-4 hover:text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:inline"
                >
                  {dict.auth.backToSite}
                </Link>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm">
                    {dict.auth.signOut}
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            {status === "active" ? children : <AccessGate status={status} email={user.email ?? ""} dict={dict.auth} />}
          </main>
        </div>
      </div>
    </HtmlShell>
  );
}
