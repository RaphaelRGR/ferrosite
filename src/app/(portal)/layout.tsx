import type { Metadata } from "next";
import Link from "next/link";
import { HtmlShell } from "@/components/layout/HtmlShell";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * Shell do Portal (área operacional). Independente do shell público:
 * landmarks próprios, um único <main> e tema isolado via `data-theme`
 * (tokens/persistência chegam em DS-001/PORTAL-001; hoje o valor é fixo).
 * Root layout próprio (I18N-001): `lang` fixo em pt-BR até a decisão sobre o
 * escopo PT/EN do Portal (33); strings ainda hard-coded pelo mesmo motivo.
 *
 * AUTH-002: o guard de sessão (server-side, fail-closed) entra aqui, antes
 * de renderizar qualquer filho. Até lá o Portal permanece aberto — estado
 * conhecido e coberto pelo smoke test.
 */
export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Portal" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HtmlShell lang="pt-BR" theme="light">
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
      >
        Pular para o conteúdo
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
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-fg-muted">
                UFSC Joinville
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded text-xs font-bold uppercase tracking-widest text-fg-muted underline-offset-4 hover:text-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Voltar ao site
          </Link>
        </nav>
      </header>

      {/* TODO(PORTAL-001): sidebar, busca, preferências e navegação por permissão. */}
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
    </HtmlShell>
  );
}
