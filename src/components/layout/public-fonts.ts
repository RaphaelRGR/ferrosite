import localFont from "next/font/local";

/**
 * Fonte do site público (DESIGN-D): Archivo variável (wght 100–900, wdth 62–125), servida do próprio
 * projeto (src/fonts, OFL; o subconjunto latin cobre o português). Aplicada só no wrapper do
 * PublicShell, nunca no <html>: Portal, login e catálogo continuam com a Geist do HtmlShell.
 */
export const publicFont = localFont({
  src: "../../fonts/archivo/archivo-latin-standard-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
