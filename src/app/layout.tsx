import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

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
    <html lang="pt-BR" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${geist.className} bg-[#0A0A0A] text-white selection:bg-[#E84E1B] selection:text-white`}>

        {/* NAVBAR PILL CENTRALIZADA */}
        <Navbar />

        {/* CONTEÚDO */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-[#050505] border-t border-white/5 text-white px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-8 sm:gap-10">
            <div>
              <p className="font-black text-lg sm:text-xl text-white mb-2 sm:mb-3">Engenharia Ferroviária</p>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">UFSC — Campus Joinville</p>
              <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide">Centro Tecnológico de Joinville (CTJ)</p>
            </div>
            <div className="text-xs sm:text-sm text-white/30 sm:text-right font-medium tracking-wide flex flex-col sm:justify-end gap-1">
              <p>Portal Acadêmico</p>
              <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}