import { Geist } from "next/font/google";
import "@/app/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

/**
 * Documento compartilhado pelos root layouts (site público por locale, Portal,
 * auth e catálogo): fonte, estilos globais e tema no <html>, para que overscroll
 * e `color-scheme` sigam o tema (06A). `themeScript` roda antes da pintura para
 * resolver "sistema" sem flash.
 */
export function HtmlShell({
  lang,
  theme,
  themeScript,
  children,
}: {
  lang: string;
  theme: "light" | "dark";
  themeScript?: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className={`scroll-smooth ${geist.variable}`} data-theme={theme} data-scroll-behavior="smooth">
      {themeScript && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
      )}
      <body className="font-sans">{children}</body>
    </html>
  );
}
