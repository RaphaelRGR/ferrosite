import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthUrl, codeChallenge, createOAuthState, decryptSecret, encryptSecret, exchangeCode, missingGoogleOAuthVars,
  readGoogleOAuthEnv, refreshAccessToken, signStateCookie, STATE_TTL_SECONDS, verifyStateCookie,
} from "@/lib/files/google-oauth";

const env = { DRIVE_TOKEN_KEY: "chave-de-teste" } as unknown as NodeJS.ProcessEnv;
const cfg = { clientId: "id.apps.googleusercontent.com", clientSecret: "s3cr3t", redirectUri: "http://localhost:3000/api/auth/google/callback" };
const form = (init?: RequestInit) => Object.fromEntries(new URLSearchParams(String(init?.body)));

describe("google oauth (DRIVE-002)", () => {
  it("variáveis: só configura com id, secret e redirect http(s); lista o que falta pelo nome", () => {
    expect(readGoogleOAuthEnv({} as NodeJS.ProcessEnv)).toBeNull();
    expect(missingGoogleOAuthVars({} as NodeJS.ProcessEnv)).toEqual(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"]);
    expect(missingGoogleOAuthVars({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b", GOOGLE_REDIRECT_URI: "localhost" } as unknown as NodeJS.ProcessEnv)).toEqual(["GOOGLE_REDIRECT_URI"]);
    expect(readGoogleOAuthEnv({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b", GOOGLE_REDIRECT_URI: cfg.redirectUri } as unknown as NodeJS.ProcessEnv)).toEqual({ clientId: "a", clientSecret: "b", redirectUri: cfg.redirectUri });
  });

  it("state + PKCE: cookie assinado volta íntegro, expira, e qualquer alteração invalida", () => {
    const now = 1_700_000_000_000;
    const payload = createOAuthState("user-1", now);
    expect(payload.exp).toBe(1_700_000_000 + STATE_TTL_SECONDS);
    expect(payload.state).not.toBe(payload.verifier);
    const cookie = signStateCookie(payload, env);
    expect(verifyStateCookie(cookie, env, now)).toEqual(payload);
    expect(verifyStateCookie(cookie, env, now + (STATE_TTL_SECONDS + 1) * 1000)).toBeNull();
    expect(verifyStateCookie(`${cookie}x`, env, now)).toBeNull();
    const [body, mac] = cookie.split(".");
    const tampered = Buffer.from(JSON.stringify({ ...payload, userId: "user-2" })).toString("base64url");
    expect(verifyStateCookie(`${tampered}.${mac}`, env, now)).toBeNull();
    expect(verifyStateCookie(`${body}.${mac}`, { DRIVE_TOKEN_KEY: "outra" } as unknown as NodeJS.ProcessEnv, now)).toBeNull();
    expect(verifyStateCookie(undefined, env, now)).toBeNull();
    expect(codeChallenge("abc")).toBe("ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0");
  });

  it("URL de autorização: escopo somente leitura, offline+consent (refresh), state e S256, sem secret", () => {
    const payload = createOAuthState("u");
    const url = new URL(buildAuthUrl(cfg, payload));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    const p = url.searchParams;
    expect(p.get("client_id")).toBe(cfg.clientId);
    expect(p.get("redirect_uri")).toBe(cfg.redirectUri);
    expect(p.get("scope")).toBe("https://www.googleapis.com/auth/drive.readonly");
    expect(p.get("access_type")).toBe("offline");
    expect(p.get("prompt")).toBe("consent");
    expect(p.get("state")).toBe(payload.state);
    expect(p.get("code_challenge")).toBe(codeChallenge(payload.verifier));
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(url.toString()).not.toContain(cfg.clientSecret);
  });

  it("troca do code: envia verifier/secret no servidor e exige refresh_token; erros do Google viram códigos", async () => {
    const ok = vi.fn(async (_u: unknown, init?: RequestInit) => {
      expect(form(init)).toMatchObject({ grant_type: "authorization_code", code: "c0de", code_verifier: "ver", client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: cfg.redirectUri });
      return new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 3600, scope: "https://www.googleapis.com/auth/drive.readonly" }), { status: 200 });
    });
    const r = await exchangeCode(cfg, "c0de", "ver", ok as unknown as typeof fetch, 1000);
    expect(r).toEqual({ ok: true, tokens: { accessToken: "at", refreshToken: "rt", expiresAt: 1000 + 3_600_000, scope: "https://www.googleapis.com/auth/drive.readonly" } });

    const noRefresh = (async () => new Response(JSON.stringify({ access_token: "at", expires_in: 10 }), { status: 200 })) as unknown as typeof fetch;
    expect(await exchangeCode(cfg, "c", "v", noRefresh)).toMatchObject({ ok: false, error: "no_refresh_token" });
    const err = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 400 })) as unknown as typeof fetch;
    expect(await exchangeCode(cfg, "c", "v", err({ error: "invalid_grant" }))).toMatchObject({ ok: false, error: "invalid_grant" });
    expect(await exchangeCode(cfg, "c", "v", err({ error: "invalid_client" }))).toMatchObject({ ok: false, error: "invalid_client" });
    expect(await exchangeCode(cfg, "c", "v", err({ error: "invalid_request", error_description: "redirect_uri mismatch" }))).toMatchObject({ ok: false, error: "redirect_uri_mismatch" });
    const down = (async () => { throw new TypeError("fetch failed"); }) as unknown as typeof fetch;
    expect(await exchangeCode(cfg, "c", "v", down)).toMatchObject({ ok: false, error: "network" });
  });

  it("refresh: grant_type refresh_token com secret; invalid_grant sinaliza revogação", async () => {
    const ok = vi.fn(async (_u: unknown, init?: RequestInit) => {
      expect(form(init)).toMatchObject({ grant_type: "refresh_token", refresh_token: "rt", client_secret: cfg.clientSecret });
      return new Response(JSON.stringify({ access_token: "novo", expires_in: 1800 }), { status: 200 });
    });
    expect(await refreshAccessToken(cfg, "rt", ok as unknown as typeof fetch, 5000)).toEqual({ ok: true, accessToken: "novo", expiresAt: 5000 + 1_800_000 });
    const revoked = (async () => new Response(JSON.stringify({ error: "invalid_grant", error_description: "Token has been expired or revoked." }), { status: 400 })) as unknown as typeof fetch;
    expect(await refreshAccessToken(cfg, "rt", revoked)).toMatchObject({ ok: false, error: "invalid_grant" });
  });

  it("cifra em repouso: ida e volta, vazio fica vazio, texto adulterado ou outra chave não decifra", () => {
    const enc = encryptSecret("refresh-token-1", env);
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain("refresh-token-1");
    expect(encryptSecret("refresh-token-1", env)).not.toBe(enc); // IV aleatório
    expect(decryptSecret(enc, env)).toBe("refresh-token-1");
    expect(encryptSecret("", env)).toBe("");
    expect(decryptSecret("", env)).toBe("");
    expect(decryptSecret(`${enc}x`, env)).toBeNull();
    expect(decryptSecret(enc, { DRIVE_TOKEN_KEY: "outra" } as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(decryptSecret("lixo", env)).toBeNull();
  });
});

// ─── Origem de token da conexão (refresh automático e revogação) ─────────────
const patches: Record<string, unknown>[] = [];
let row: Record<string, unknown> | null = null;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row }) }) }),
      update: (patch: Record<string, unknown>) => {
        patches.push(patch);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc: async () => ({ data: [] }) }) }));

describe("conexão: token da linha do banco", () => {
  beforeEach(() => {
    patches.length = 0;
    vi.stubEnv("DRIVE_TOKEN_KEY", "chave-de-teste");
    vi.stubEnv("GOOGLE_CLIENT_ID", cfg.clientId);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", cfg.clientSecret);
    vi.stubEnv("GOOGLE_REDIRECT_URI", cfg.redirectUri);
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "");
    vi.stubEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  const base = () => ({
    singleton: true, status: "connected", provider_account_email: "c@x.invalid", provider_account_name: "", scope: "s",
    access_token_enc: encryptSecret("access-antigo"), refresh_token_enc: encryptSecret("refresh-1"),
    access_token_expires_at: new Date(Date.now() + 3_600_000).toISOString(), root_folder_id: "pasta1", root_folder_name: "Pasta", connected_by: null, connected_at: null,
    last_checked_at: null, last_check_result: {}, last_error: "", updated_at: "",
  });

  it("access token válido é usado sem tocar no Google; expirado renova pelo refresh e persiste cifrado", async () => {
    const { getDriveClient } = await import("@/lib/files/drive-connection");
    row = base();
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string | URL | Request, init?: RequestInit) => {
      calls.push(String(u));
      if (String(u).includes("oauth2.googleapis.com/token")) {
        expect(form(init)).toMatchObject({ grant_type: "refresh_token", refresh_token: "refresh-1" });
        return new Response(JSON.stringify({ access_token: "access-novo", expires_in: 3600 }), { status: 200 });
      }
      expect((init?.headers as Record<string, string>).Authorization).toMatch(/^Bearer access-/);
      return new Response(JSON.stringify({ user: { emailAddress: "c@x.invalid", displayName: "C" } }), { status: 200 });
    }));
    const conn = (await getDriveClient())!;
    expect(conn.mode).toBe("oauth");
    expect(conn.rootFolderId).toBe("pasta1");
    expect(await conn.client.about()).toMatchObject({ ok: true, email: "c@x.invalid" });
    expect(calls.some((c) => c.includes("/token"))).toBe(false);

    row = { ...base(), access_token_expires_at: new Date(Date.now() - 1000).toISOString() };
    const conn2 = (await getDriveClient())!;
    expect(await conn2.client.about()).toMatchObject({ ok: true });
    expect(calls.filter((c) => c.includes("/token"))).toHaveLength(1);
    const persisted = patches.find((p) => "access_token_enc" in p)!;
    expect(decryptSecret(String(persisted.access_token_enc))).toBe("access-novo");
    expect(String(persisted.access_token_enc)).not.toContain("access-novo");
  });

  it("refresh recusado com invalid_grant marca a conexão como revogada e devolve o código 'revoked'", async () => {
    const { getDriveClient } = await import("@/lib/files/drive-connection");
    row = { ...base(), access_token_expires_at: new Date(Date.now() - 1000).toISOString() };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })));
    const conn = (await getDriveClient())!;
    expect(await conn.client.about()).toMatchObject({ ok: false, error: "revoked" });
    expect(patches.find((p) => p.status === "revoked")).toBeTruthy();
  });

  it("sem conexão nem conta de serviço ⇒ null; desconectar revoga no Google e zera tokens", async () => {
    const { disconnect, getDriveClient } = await import("@/lib/files/drive-connection");
    row = { ...base(), status: "disconnected", refresh_token_enc: "" };
    expect(await getDriveClient()).toBeNull();
    row = base();
    const revoke = vi.fn(async (u: string | URL | Request) => {
      expect(String(u)).toContain("oauth2.googleapis.com/revoke?token=refresh-1");
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", revoke);
    expect(await disconnect()).toEqual({ revokedAtGoogle: true });
    const cleared = patches.at(-1)!;
    expect(cleared).toMatchObject({ status: "disconnected", access_token_enc: "", refresh_token_enc: "", provider_account_email: "" });
  });
});
