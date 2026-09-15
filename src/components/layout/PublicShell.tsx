import { Navbar } from "@/components/layout/Navbar";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * Shell do site público: skip link, Navbar, único <main> e footer.
 * Usado pelo layout de (public) e pela not-found raiz, para que rotas
 * inexistentes continuem com a navegação pública.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas text-fg selection:bg-accent selection:text-fg-on-action">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-action focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-fg-on-action focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-canvas"
      >
        Pular para o conteúdo
      </a>

      <Navbar />

      <main id="conteudo" className="min-h-screen">
        {children}
      </main>

      <footer className="w-full bg-[#050505] border-t border-white/5 text-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-8 sm:gap-10">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
            <BrandLogo width={140} />
            <div>
            <p className="font-black text-lg sm:text-xl text-white mb-2 sm:mb-3">Engenharia Ferroviária</p>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">UFSC — Campus Joinville</p>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">Centro Tecnológico de Joinville (CTJ)</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-white/30 sm:text-right font-medium tracking-wide flex flex-col sm:justify-end gap-1">
            <p>Portal Acadêmico</p>
            <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
