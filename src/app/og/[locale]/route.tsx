import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { OG_SIZE, SITE_URL } from "@/i18n/metadata";

/**
 * Cartão padrão de compartilhamento das páginas públicas (1200x630). Páginas
 * com capa própria usam a foto da publicação; as demais usam este cartão, com
 * identidade oficial e a frase do catálogo do locale — nada inventado.
 *
 * É uma rota normal (e não `opengraph-image.tsx`) porque cada página define seu
 * próprio bloco `openGraph`, e metadata de segmento filho substitui a do pai:
 * a URL precisa ser estável para entrar em `publicPageMetadata`.
 */

/** Domínio mostrado no rodapé do cartão. */
const SITE_HOST = SITE_URL.host.replace(/^www\./, "");

export async function GET(_req: Request, ctx: RouteContext<"/og/[locale]">) {
  const { locale } = await ctx.params;
  if (!hasLocale(locale)) return new NextResponse(null, { status: 404 });
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  const logo = await readFile(path.join(process.cwd(), "public/brand/efm-logo-lockup.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#f2f2f2",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse não usa next/image */}
          <img src={logoSrc} width={120} height={120} alt="" style={{ background: "#ffffff", borderRadius: 24, padding: 12 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, color: "#ff8a5b" }}>UFSC JOINVILLE</span>
            <span style={{ fontSize: 26, color: "#a5abb4" }}>{dict.footer.center}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{dict.site.brandLine1}</span>
          <span style={{ fontSize: 34, color: "#a5abb4", maxWidth: 900, lineHeight: 1.3 }}>{dict.site.description}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ width: 120, height: 8, borderRadius: 999, background: "#e84e1b" }} />
          <span style={{ fontSize: 28, color: "#a5abb4" }}>{SITE_HOST}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
