import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Engenharia Ferroviária e Metroviária — UFSC Joinville",
  description: "Portal do curso de Engenharia Ferroviária e Metroviária da UFSC Campus Joinville.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${geist.className} bg-[#0A0A0A] text-white selection:bg-[#E84E1B] selection:text-white`}>

        {/* NAVBAR - Glassmorphism Premium */}
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-black/20 backdrop-blur-md border-b border-white/5 transition-all duration-500">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E84E1B] to-[#ff7a4d] flex items-center justify-center text-xl shadow-lg shadow-[#E84E1B]/20 group-hover:rotate-6 transition-transform duration-500">
                🚂
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-black text-sm leading-none tracking-tight uppercase">Engenharia Ferroviária</span>
                <span className="text-white/40 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">UFSC Joinville</span>
              </div>
            </Link>
            
            <div className="hidden md:flex gap-12 text-[10px] font-black items-center uppercase tracking-[0.2em]">
              <Link href="/sobre" className="text-white/50 hover:text-white transition-all hover:tracking-[0.3em]">Sobre</Link>
              <Link href="/visitas" className="text-white/50 hover:text-white transition-all hover:tracking-[0.3em]">Visitas</Link>
              <Link href="/eventos" className="text-white/50 hover:text-white transition-all hover:tracking-[0.3em]">Eventos</Link>
              <Link href="/noticias" className="text-white/50 hover:text-white transition-all hover:tracking-[0.3em]">Notícias</Link>
              
              <Link href="/portal" className="relative group overflow-hidden bg-white text-black px-8 py-3 rounded-full font-black transition-all hover:bg-[#E84E1B] hover:text-white hover:shadow-[0_0_30px_rgba(232,78,27,0.4)]">
                <span className="relative z-10">Portal do Aluno</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* CONTEÚDO */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* FOOTER - Dark Minimalist */}
        <footer className="w-full bg-[#050505] border-t border-white/5 text-white px-6 py-16 mt-0">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-10">
            <div>
              <p className="font-black text-xl text-white mb-3">Engenharia Ferroviária</p>
              <p className="text-white/40 text-sm font-medium tracking-wide">UFSC — Campus Joinville</p>
              <p className="text-white/40 text-sm font-medium tracking-wide">Centro Tecnológico de Joinville (CTJ)</p>
            </div>
            <div className="text-sm text-white/30 md:text-right font-medium tracking-wide flex flex-col justify-end">
              <p>Portal Acadêmico</p>
              <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}