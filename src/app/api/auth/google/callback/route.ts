import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createDriveClient } from "@/lib/files/drive";
import { saveConnection } from "@/lib/files/drive-connection";
import { requireDriveManager } from "@/lib/files/drive-guard";
import { exchangeCode, readGoogleOAuthEnv, STATE_COOKIE, verifyStateCookie } from "@/lib/files/google-oauth";
import { logEvent } from "@/lib/observability/log";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const INTEGRATIONS = "/portal/configuracoes/integracoes";

/**
 * Callback do OAuth do Google Drive (DRIVE-002): a mesma sessão Supabase que
 * iniciou (state assinado + userId) troca o `code` no servidor, identifica a
 * conta pelo Drive (`about`) e persiste tokens cifrados. Erros viram um código
 * na querystring (nunca detalhe técnico nem segredo); a sessão do Portal não muda.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (code: string) => {
    const res = NextResponse.redirect(new URL(`${INTEGRATIONS}?drive=${code}`, req.url), 307);
    res.cookies.set(STATE_COOKIE, "", { httpOnly: true, path: "/api/auth/google", maxAge: 0 });
    return res;
  };
  const guard = await requireDriveManager();
  if (!guard.ok) {
    if (guard.reason === "unauthenticated") return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(INTEGRATIONS)}`, req.url), 307);
    return new NextResponse(null, { status: 403 });
  }
  const cfg = readGoogleOAuthEnv();
  if (!cfg) return back("unconfigured");

  const payload = verifyStateCookie((await cookies()).get(STATE_COOKIE)?.value);
  const state = url.searchParams.get("state") ?? "";
  if (!payload || payload.state !== state || payload.userId !== guard.userId) return back("state");

  const providerError = url.searchParams.get("error");
  if (providerError) {
    logEvent("warn", "drive.oauth.denied", { userId: guard.userId, providerError });
    return back(providerError === "access_denied" ? "access_denied" : "provider");
  }
  const code = url.searchParams.get("code") ?? "";
  if (!code) return back("provider");

  const ex = await exchangeCode(cfg, code, payload.verifier);
  if (!ex.ok) {
    logEvent("warn", "drive.oauth.exchange_failed", { userId: guard.userId, error: ex.error });
    return back(ex.error);
  }
  const probe = createDriveClient({ rootFolderId: "", token: async () => ex.tokens.accessToken });
  const about = await probe.about();
  if (!about.ok) {
    logEvent("warn", "drive.oauth.about_failed", { userId: guard.userId, error: about.error });
    return back(about.error);
  }
  if (!(await saveConnection({ tokens: ex.tokens, email: about.email, name: about.name, userId: guard.userId }))) return back("persist");
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "drive.connected", p_target_type: "drive_integration", p_target_id: "singleton", p_result: "ok", p_diff: { account: about.email, scope: ex.tokens.scope } });
  logEvent("info", "drive.oauth.connected", { userId: guard.userId });
  return back("connected");
}
