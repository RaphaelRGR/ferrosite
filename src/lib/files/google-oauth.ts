import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SCOPES } from "./drive";

/**
 * OAuth 2.0 do Google para o Drive institucional (DRIVE-002, 21). Só para
 * autorizar o Drive — a identidade do Portal é do Supabase e nada aqui cria
 * sessão. Tudo no servidor: `state` + PKCE num cookie httpOnly assinado, troca
 * do `code` e refresh pelo `fetch`, tokens cifrados (AES-256-GCM) antes de
 * ir ao banco. O client secret nunca sai deste módulo nem entra em logs.
 */
export interface GoogleOAuthEnv {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const STATE_COOKIE = "gdrive_oauth";
export const STATE_TTL_SECONDS = 10 * 60;

export function readGoogleOAuthEnv(env: NodeJS.ProcessEnv = process.env): GoogleOAuthEnv | null {
  const clientId = env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri = env.GOOGLE_REDIRECT_URI ?? "";
  if (!clientId || !clientSecret || !/^https?:\/\//.test(redirectUri)) return null;
  return { clientId, clientSecret, redirectUri };
}

/** Quais variáveis faltam (para a UI/health dizerem exatamente o que configurar). */
export function missingGoogleOAuthVars(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = [];
  if (!env.GOOGLE_CLIENT_ID) out.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) out.push("GOOGLE_CLIENT_SECRET");
  if (!/^https?:\/\//.test(env.GOOGLE_REDIRECT_URI ?? "")) out.push("GOOGLE_REDIRECT_URI");
  return out;
}

// ─── Segredo do servidor para assinar o state e cifrar tokens ───────────────
// Derivado de DRIVE_TOKEN_KEY ou, na falta, da service role (mesmo padrão de CHALLENGE_HASH_SECRET).
function serverSecret(env: NodeJS.ProcessEnv = process.env): Buffer {
  const base = env.DRIVE_TOKEN_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base) throw new Error("DRIVE_TOKEN_KEY ou SUPABASE_SERVICE_ROLE_KEY necessário para proteger tokens do Drive");
  return createHash("sha256").update(`ferrosite-drive:${base}`).digest();
}

// ─── PKCE + state ───────────────────────────────────────────────────────────
export interface OAuthStatePayload {
  state: string;
  verifier: string;
  userId: string;
  exp: number;
}

const b64url = (v: Buffer | string) => Buffer.from(v).toString("base64url");

export function createOAuthState(userId: string, now = Date.now()): OAuthStatePayload {
  return { state: b64url(randomBytes(24)), verifier: b64url(randomBytes(48)), userId, exp: Math.floor(now / 1000) + STATE_TTL_SECONDS };
}

export function codeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Cookie assinado (HMAC) — não cifrado: nada nele é secreto além do verifier, que só serve com o `code` de uma vez. */
export function signStateCookie(payload: OAuthStatePayload, env?: NodeJS.ProcessEnv): string {
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac("sha256", serverSecret(env)).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifyStateCookie(value: string | undefined, env?: NodeJS.ProcessEnv, now = Date.now()): OAuthStatePayload | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", serverSecret(env)).update(body).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as OAuthStatePayload;
    if (typeof payload.state !== "string" || typeof payload.verifier !== "string" || typeof payload.userId !== "string") return null;
    if (payload.exp * 1000 < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildAuthUrl(cfg: GoogleOAuthEnv, payload: OAuthStatePayload, scope = SCOPES): string {
  const p = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope,
    access_type: "offline", // refresh token
    prompt: "consent", // garante refresh token mesmo em reconexão
    include_granted_scopes: "false",
    state: payload.state,
    code_challenge: codeChallenge(payload.verifier),
    code_challenge_method: "S256",
  });
  return `${AUTH_URL}?${p}`;
}

// ─── Troca e refresh ────────────────────────────────────────────────────────
export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scope: string;
}

export type OAuthError = "invalid_grant" | "invalid_client" | "redirect_uri_mismatch" | "access_denied" | "provider" | "network" | "no_refresh_token";

async function tokenRequest(body: Record<string, string>, fetchImpl: typeof fetch): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: OAuthError; detail: string }> {
  let res: Response;
  try {
    res = await fetchImpl(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body), signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    return { ok: false, error: "network", detail: (e as Error).name };
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, data };
  const code = String(data.error ?? "");
  const desc = String(data.error_description ?? "").slice(0, 200);
  if (code === "invalid_grant") return { ok: false, error: "invalid_grant", detail: desc };
  if (code === "invalid_client" || code === "unauthorized_client") return { ok: false, error: "invalid_client", detail: desc };
  if (code === "redirect_uri_mismatch" || /redirect_uri/i.test(desc)) return { ok: false, error: "redirect_uri_mismatch", detail: desc };
  return { ok: false, error: "provider", detail: `${code} ${desc}`.trim() };
}

export async function exchangeCode(cfg: GoogleOAuthEnv, code: string, verifier: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<{ ok: true; tokens: TokenSet } | { ok: false; error: OAuthError; detail: string }> {
  const r = await tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri }, fetchImpl);
  if (!r.ok) return r;
  const d = r.data as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string };
  if (!d.access_token) return { ok: false, error: "provider", detail: "resposta sem access_token" };
  if (!d.refresh_token) return { ok: false, error: "no_refresh_token", detail: "Google não devolveu refresh_token (revogue o acesso do app na conta e conecte de novo)" };
  return { ok: true, tokens: { accessToken: d.access_token, refreshToken: d.refresh_token, expiresAt: now + (d.expires_in ?? 3600) * 1000, scope: d.scope ?? "" } };
}

export async function refreshAccessToken(cfg: GoogleOAuthEnv, refreshToken: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<{ ok: true; accessToken: string; expiresAt: number } | { ok: false; error: OAuthError; detail: string }> {
  const r = await tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: cfg.clientId, client_secret: cfg.clientSecret }, fetchImpl);
  if (!r.ok) return r;
  const d = r.data as { access_token?: string; expires_in?: number };
  if (!d.access_token) return { ok: false, error: "provider", detail: "resposta sem access_token" };
  return { ok: true, accessToken: d.access_token, expiresAt: now + (d.expires_in ?? 3600) * 1000 };
}

/** Revogação no Google (melhor esforço): o token pode já estar inválido — desconectar localmente vale igual. */
export async function revokeToken(token: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10_000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Cifra dos tokens em repouso ────────────────────────────────────────────
export function encryptSecret(plain: string, env?: NodeJS.ProcessEnv): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", serverSecret(env), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${b64url(iv)}.${b64url(enc)}.${b64url(cipher.getAuthTag())}`;
}

export function decryptSecret(value: string, env?: NodeJS.ProcessEnv): string | null {
  if (!value) return "";
  const [v, iv, enc, tag] = value.split(".");
  if (v !== "v1" || !iv || !enc || !tag) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", serverSecret(env), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(enc, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
