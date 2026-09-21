import { createSign } from "node:crypto";

/**
 * Google Drive por conta de serviço (DRIVE-001, doc 17/21): JWT RS256 assinado
 * com `node:crypto` trocado por access token no OAuth2 e chamadas REST à API
 * v3 com `fetch` — sem SDK (três chamadas HTTP não justificam dependência).
 * Escopo somente leitura: o Portal registra metadados e serve bytes por proxy;
 * nunca cria links públicos permanentes no Drive. Sem credencial ⇒ `null` e a
 * UI declara a pendência (nada é simulado).
 */
export interface DriveEnv {
  clientEmail: string;
  privateKey: string;
  /** Pasta/drive institucional: arquivos fora dela não são aceitos (quando definida). */
  rootFolderId: string;
}

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  md5: string | null;
  trashed: boolean;
  parents: string[];
  hasThumbnail: boolean;
}

export type DriveError = "not_found" | "forbidden" | "trashed" | "outside_root" | "provider" | "unconfigured";

const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3/files";
const META_FIELDS = "id,name,mimeType,size,md5Checksum,trashed,parents,hasThumbnail";
/** Limite prático para o proxy (allowlist do banco já limita por tipo; aqui é a rede). */
export const MAX_PROXY_BYTES = 500 * 1024 * 1024;

export function readDriveEnv(env: NodeJS.ProcessEnv = process.env): DriveEnv | null {
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "";
  // A chave pode vir em base64 (uma linha, comum em painéis) ou PEM com "\n" escapado.
  const raw = env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "";
  if (!clientEmail || !raw) return null;
  const privateKey = raw.includes("-----BEGIN") ? raw.replace(/\\n/g, "\n") : Buffer.from(raw, "base64").toString("utf8");
  if (!privateKey.includes("-----BEGIN")) return null;
  return { clientEmail, privateKey, rootFolderId: env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? "" };
}

export function isDriveConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readDriveEnv(env) !== null;
}

/** Aceita o id puro ou uma URL do Drive (`/file/d/<id>/…`, `?id=<id>`, `/uc?id=`). */
export function parseDriveId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (!/(^|\.)google\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/d\/([A-Za-z0-9_-]{10,})/);
    if (m) return m[1];
    const q = u.searchParams.get("id");
    return q && /^[A-Za-z0-9_-]{10,}$/.test(q) ? q : null;
  } catch {
    return null;
  }
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

/** JWT de conta de serviço (RS256), com `iat/exp` explícitos para teste. */
export function buildAssertion(cfg: Pick<DriveEnv, "clientEmail" | "privateKey">, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: cfg.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${signer.sign(cfg.privateKey, "base64url")}`;
}

export interface DriveClient {
  getMeta(fileId: string): Promise<{ ok: true; meta: DriveFileMeta } | { ok: false; error: DriveError; detail?: string }>;
  /** Verdadeiro quando não há pasta raiz configurada ou o arquivo descende dela (até 10 níveis). */
  withinRoot(meta: DriveFileMeta): Promise<boolean>;
  /** Bytes do arquivo (alt=media) — devolve a Response da API para streaming. */
  download(fileId: string, range?: string | null): Promise<Response>;
  /** Miniatura gerada pelo Drive (requer o token; o link expira). */
  thumbnail(fileId: string, size: number): Promise<Response | null>;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

export function createDriveClient(cfg: DriveEnv, fetchImpl: typeof fetch = fetch, cache: { current: TokenCache | null } = tokenCache): DriveClient {
  async function token(): Promise<string> {
    if (cache.current && cache.current.expiresAt > Date.now() + 60_000) return cache.current.token;
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: buildAssertion(cfg) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`token ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cache.current = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }
  const authed = async (url: string, init: RequestInit = {}) =>
    fetchImpl(url, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${await token()}` }, signal: init.signal ?? AbortSignal.timeout(30_000) });

  async function rawMeta(fileId: string) {
    return authed(`${API}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(META_FIELDS)}&supportsAllDrives=true`);
  }

  return {
    async getMeta(fileId) {
      let res: Response;
      try {
        res = await rawMeta(fileId);
      } catch (e) {
        return { ok: false, error: "provider", detail: (e as Error).message };
      }
      if (res.status === 404) return { ok: false, error: "not_found" };
      if (res.status === 403) return { ok: false, error: "forbidden" };
      if (!res.ok) return { ok: false, error: "provider", detail: `http ${res.status}` };
      const d = (await res.json()) as { id: string; name: string; mimeType: string; size?: string; md5Checksum?: string; trashed?: boolean; parents?: string[]; hasThumbnail?: boolean };
      const meta: DriveFileMeta = {
        id: d.id, name: d.name, mimeType: d.mimeType, size: d.size ? Number(d.size) : null, md5: d.md5Checksum ?? null,
        trashed: Boolean(d.trashed), parents: d.parents ?? [], hasThumbnail: Boolean(d.hasThumbnail),
      };
      if (meta.trashed) return { ok: false, error: "trashed" };
      return { ok: true, meta };
    },
    async withinRoot(meta) {
      if (!cfg.rootFolderId) return true;
      let frontier = [...meta.parents];
      const seen = new Set<string>();
      for (let depth = 0; depth < 10 && frontier.length; depth += 1) {
        if (frontier.includes(cfg.rootFolderId)) return true;
        const next: string[] = [];
        for (const id of frontier) {
          if (seen.has(id)) continue;
          seen.add(id);
          const res = await rawMeta(id);
          if (!res.ok) continue;
          const d = (await res.json()) as { parents?: string[] };
          next.push(...(d.parents ?? []));
        }
        frontier = next;
      }
      return false;
    },
    download(fileId, range) {
      return authed(`${API}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, { headers: range ? { Range: range } : {}, signal: AbortSignal.timeout(120_000) });
    },
    async thumbnail(fileId, size) {
      const res = await authed(`${API}/${encodeURIComponent(fileId)}?fields=thumbnailLink&supportsAllDrives=true`);
      if (!res.ok) return null;
      const d = (await res.json()) as { thumbnailLink?: string };
      if (!d.thumbnailLink) return null;
      const url = d.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
      return authed(url);
    },
  };
}

const tokenCache: { current: TokenCache | null } = { current: null };

export function getDriveClient(): DriveClient | null {
  const cfg = readDriveEnv();
  return cfg ? createDriveClient(cfg) : null;
}
