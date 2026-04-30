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
    <html lang="pt-BR">
      <body className={geist.className}>

        {/* NAVBAR */}
        <nav className="w-full bg-[#1B3A6B] text-white px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-[#E84E1B] font-bold text-xl">🚂</span>
            <span className="font-semibold text-sm leading-tight">
              Engenharia Ferroviária<br />
              <span className="text-gray-300 font-normal text-xs">UFSC Joinville</span>
            </span>
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/sobre" className="hover:text-[#E84E1B] transition-colors">Sobre</Link>
            <Link href="/visitas" className="hover:text-[#E84E1B] transition-colors">Visitas</Link>
            <Link href="/eventos" className="hover:text-[#E84E1B] transition-colors">Eventos</Link>
            <Link href="/noticias" className="hover:text-[#E84E1B] transition-colors">Notícias</Link>
            <Link href="/portal" className="bg-[#E84E1B] px-4 py-1 rounded-full text-white hover:bg-orange-600 transition-colors">Portal do Aluno</Link>
          </div>
        </nav>

        {/* CONTEÚDO */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-[#1B3A6B] text-white px-6 py-8 mt-16">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
            <div>
              <p className="font-semibold text-sm">Engenharia Ferroviária e Metroviária</p>
              <p className="text-gray-300 text-xs mt-1">UFSC — Campus Joinville</p>
              <p className="text-gray-300 text-xs">Centro Tecnológico de Joinville (CTJ)</p>
            </div>
            <div className="text-xs text-gray-400">
              <p>Portal não oficial mantido pela AFER</p>
              <p>Associação dos Estudantes de Engenharia Ferroviária</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}