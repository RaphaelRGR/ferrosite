import Link from "next/link";

/**
 * Shell do Portal (área operacional). Independente do shell público:
 * landmarks próprios, um único <main> e tema isolado via `data-theme`
 * (tokens/persistência chegam em DS-001/PORTAL-001; hoje o valor é fixo).
 *
 * AUTH-002: o guard de sessão (server-side, fail-closed) entra aqui, antes
 * de renderizar qualquer filho. Até lá o Portal permanece aberto — estado
 * conhecido e coberto pelo smoke test.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="light" className="flex min-h-screen flex-col bg-neutral-50 text-neutral-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-[#E84E1B] focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-neutral-200 bg-white">
        <nav
          aria-label="Portal"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
        >
          <Link href="/portal" className="flex flex-col leading-none">
            <span className="text-sm font-black uppercase tracking-[0.12em]">Portal</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
              Engenharia Ferroviária — UFSC Joinville
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-neutral-600 underline-offset-4 hover:text-[#E84E1B] hover:underline"
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
  );
}
