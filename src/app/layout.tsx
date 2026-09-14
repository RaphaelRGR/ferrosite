import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Engenharia Ferroviária e Metroviária — UFSC Joinville",
  description: "Portal do curso de Engenharia Ferroviária e Metroviária da UFSC Campus Joinville.",
};

/**
 * Root layout mínimo: documento, fonte e estilos globais.
 * Navegação, <main> e footer pertencem aos shells de (public) e (portal),
 * para que cada área tenha landmarks próprios e um único <main>.
 * `lang` fixo até I18N-001 introduzir roteamento por locale.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
