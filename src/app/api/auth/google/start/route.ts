import { NextResponse } from "next/server";
import { requireDriveManager } from "@/lib/files/drive-guard";
import { buildAuthUrl, createOAuthState, readGoogleOAuthEnv, signStateCookie, STATE_COOKIE, STATE_TTL_SECONDS } from "@/lib/files/google-oauth";
import { logEvent } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

const INTEGRATIONS = "/portal/configuracoes/integracoes";

/**
 * Início do OAuth do Google Drive (DRIVE-002): exige sessão Supabase ativa de
 * admin/coordenação; grava `state` + PKCE em cookie httpOnly assinado e
 * redireciona ao consentimento. Nunca cria sessão no Portal.
 */
export async function GET(req: Request) {
  const guard = await requireDriveManager();
  if (!guard.ok) {
    if (guard.reason === "unauthenticated") return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(INTEGRATIONS)}`, req.url), 307);
    return new NextResponse(null, { status: 403 });
  }
  const cfg = readGoogleOAuthEnv();
  if (!cfg) return NextResponse.redirect(new URL(`${INTEGRATIONS}?drive=unconfigured`, req.url), 307);
  const payload = createOAuthState(guard.userId);
  const res = NextResponse.redirect(buildAuthUrl(cfg, payload), 307);
  res.cookies.set(STATE_COOKIE, signStateCookie(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: cfg.redirectUri.startsWith("https://"),
    path: "/api/auth/google",
    maxAge: STATE_TTL_SECONDS,
  });
  logEvent("info", "drive.oauth.start", { userId: guard.userId });
  return res;
}
