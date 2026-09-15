import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HtmlShell } from "@/components/layout/HtmlShell";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/dictionaries";
import { signOut } from "@/lib/auth/actions";
import { getCurrentSession } from "@/lib/auth/session";
import { AccessGate } from "./AccessGate";

/**
 * Shell do Portal (área operacional). Root layout próprio, tema isolado via
 * `data-theme` (persistência em PORTAL-001) e `lang` fixo em pt-BR até a decisão
 * sobre o escopo PT/EN do Portal (33).
 *
 * Gate (AUTH-002, fail-closed): o proxy já exige sessão; aqui exigimos perfil
 * ATIVO. Pendente/desativado vê apenas a tela de bloqueio. A RLS é a última
 * linha: nenhuma consulta abaixo depende só disto.
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

  return (
    <HtmlShell lang="pt-BR" theme="light">
      <div className="flex min-h-screen flex-col bg-canvas text-fg">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
        >
          {dict.a11y.skipToContent}
        </a>

        <header className="border-b border-line bg-surface">
          <nav
            aria-label="Portal"
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
          >
            <Link
              href="/portal"
              className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <BrandLogo width={56} className="p-1" />
              <span className="flex flex-col leading-none">
                <span className="text-sm font-black uppercase tracking-[0.12em]">Portal</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted">UFSC Joinville</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-xs text-fg-muted sm:inline">
                {profile?.full_name || user.email}
              </span>
              <Link
                href="/pt"
                className="rounded text-xs font-bold uppercase tracking-widest text-fg-muted underline-offset-4 hover:text-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                {dict.auth.backToSite}
              </Link>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  {dict.auth.signOut}
                </Button>
              </form>
            </div>
          </nav>
        </header>

        {/* TODO(PORTAL-001): sidebar, busca, preferências e navegação por permissão. */}
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          {status === "active" ? children : <AccessGate status={status} email={user.email ?? ""} dict={dict.auth} />}
        </main>
      </div>
    </HtmlShell>
  );
}
