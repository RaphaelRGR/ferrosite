import { Geist } from "next/font/google";
import "@/app/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

/**
 * Documento compartilhado pelos três root layouts (site público por locale,
 * Portal e catálogo): fonte, estilos globais e tema no <html>, para que
 * overscroll e `color-scheme` sigam o tema (06A).
 */
export function HtmlShell({
  lang,
  theme,
  children,
}: {
  lang: string;
  theme: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={`scroll-smooth ${geist.variable}`} data-theme={theme} data-scroll-behavior="smooth">
      <body className="font-sans">{children}</body>
    </html>
  );
}
