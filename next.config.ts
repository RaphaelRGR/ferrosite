import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Cabeçalhos de segurança (OPS-001, 21) após inventário de origens: fontes via
 * next/font (self-hosted), imagens/vídeos locais, conexões só com o Supabase.
 * Scripts: Next injeta scripts inline nas páginas estáticas; sem nonce (que
 * exigiria renderização dinâmica de todo o site público) mantemos
 * 'unsafe-inline' em script-src e compensamos com object-src/base-uri/
 * frame-ancestors/form-action estritos. 'unsafe-eval' só em desenvolvimento (HMR).
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Rotas renomeadas mantêm redirect permanente (28): /visitas -> /experiencias (guia §9).
  async redirects() {
    return [{ source: "/:locale(pt|en)/visitas", destination: "/:locale/experiencias", permanent: true }];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: SECURITY_HEADERS },
      // Portal, login e APIs nunca entram em cache compartilhado (21: sessão/PII).
      { source: "/portal/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      { source: "/login", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // mídia pública (DRIVE-001): capa de publicação viva; cache curto para despublicação/revogação valer em minutos
      { source: "/api/midia/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=300, stale-while-revalidate=600" }] },
    ];
  },
};

export default nextConfig;
