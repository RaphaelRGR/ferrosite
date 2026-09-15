import type { Metadata } from "next";
import { HtmlShell } from "@/components/layout/HtmlShell";

export const metadata: Metadata = {
  title: "Entrar | Portal",
  robots: { index: false, follow: false },
};

/**
 * Root layout das páginas de autenticação (fora do shell público e do Portal):
 * claro, mínimo, um único <main>. PT fixo até a decisão sobre locale do Portal (33).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlShell lang="pt-BR" theme="light">
      <div className="flex min-h-screen flex-col bg-canvas text-fg">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
        >
          Pular para o conteúdo
        </a>
        <main id="conteudo" className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          {children}
        </main>
      </div>
    </HtmlShell>
  );
}
