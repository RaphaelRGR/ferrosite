import { HtmlShell } from "@/components/layout/HtmlShell";

/**
 * Shell mínimo do catálogo de componentes (ferramenta de desenvolvimento):
 * skip link e um único <main>, sem navegação do site ou do Portal.
 */
export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlShell lang="pt-BR" theme="light">
    <div className="min-h-screen bg-canvas text-fg">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
    </HtmlShell>
  );
}
