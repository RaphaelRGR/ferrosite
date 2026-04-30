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
        <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-[#0A0A0A]/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between transition-all duration-500">
          <Link href="/" className="flex items-center gap-4 group">
            <span className="text-[#E84E1B] font-bold text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">🚂</span>
            <span className="font-bold text-sm leading-tight tracking-tight">
              Engenharia Ferroviária<br />
              <span className="text-white/40 font-normal text-[11px] uppercase tracking-widest">UFSC Joinville</span>
            </span>
          </Link>
          
          <div className="hidden md:flex gap-10 text-sm font-bold items-center uppercase tracking-widest text-[11px]">
            <Link href="/sobre" className="text-white/60 hover:text-white transition-colors">Sobre</Link>
            <Link href="/visitas" className="text-white/60 hover:text-white transition-colors">Visitas</Link>
            <Link href="/eventos" className="text-white/60 hover:text-white transition-colors">Eventos</Link>
            <Link href="/noticias" className="text-white/60 hover:text-white transition-colors">Notícias</Link>
            
            <Link href="/portal" className="bg-[#E84E1B] px-8 py-3 rounded-full text-white shadow-[0_0_15px_rgba(232,78,27,0.2)] hover:shadow-[0_0_30px_rgba(232,78,27,0.4)] hover:-translate-y-0.5 transition-all">
              Portal do Aluno
            </Link>
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