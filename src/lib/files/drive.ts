import { createSign } from "node:crypto";

/**
 * Cliente Google Drive (DRIVE-001/002, docs 17/21): Drive API v3 por `fetch`,
 * sem SDK. A origem do token é injetável: conta de serviço (JWT RS256 por
 * `node:crypto`, variáveis `GOOGLE_SERVICE_ACCOUNT_*`) ou a conexão OAuth
 * institucional (`drive-connection.ts`). Só leitura: o Portal registra
 * metadados e serve bytes por proxy; nunca cria links públicos no Drive.
 * Sem credencial ⇒ `null` e a UI declara a pendência (nada é simulado).
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

export interface DriveListItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  isFolder: boolean;
}

export type DriveError = "not_found" | "forbidden" | "trashed" | "outside_root" | "provider" | "unconfigured" | "api_disabled" | "revoked" | "network";

export const SCOPE_READONLY = "https://www.googleapis.com/auth/drive.readonly";
/** Escrita só no que o próprio app cria (DRIVE-003: subpastas e uploads dentro da raiz). */
export const SCOPE_FILE = "https://www.googleapis.com/auth/drive.file";
export const SCOPES = `${SCOPE_READONLY} ${SCOPE_FILE}`;
export function scopeAllowsWrite(scope: string): boolean {
  return scope.split(/\s+/).includes(SCOPE_FILE);
}
export const FOLDER_MIME = "application/vnd.google-apps.folder";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
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

/** Conta de serviço configurada por variáveis (alternativa à conexão OAuth). */
export function isServiceAccountConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readDriveEnv(env) !== null;
}

/** Aceita o id puro ou uma URL do Drive (`/file/d/<id>/…`, `/folders/<id>`, `?id=<id>`). */
export function parseDriveId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{10,}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (!/(^|\.)google\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/(?:d|folders)\/([A-Za-z0-9_-]{10,})/);
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
  const claims = b64url(JSON.stringify({ iss: cfg.clientEmail, scope: SCOPE_READONLY, aud: TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${signer.sign(cfg.privateKey, "base64url")}`;
}

/** Origem do access token: cada chamada devolve um token válido ou lança `DriveTokenError`. */
export type TokenSource = () => Promise<string>;

export class DriveTokenError extends Error {
  constructor(public readonly code: DriveError, message: string = code) {
    super(message);
    this.name = "DriveTokenError";
  }
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

export function createServiceAccountTokenSource(cfg: DriveEnv, fetchImpl: typeof fetch = fetch, cache: { current: TokenCache | null } = saCache): TokenSource {
  return async () => {
    if (cache.current && cache.current.expiresAt > Date.now() + 60_000) return cache.current.token;
    const res = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: buildAssertion(cfg) }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new DriveTokenError("provider", `token ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    cache.current = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  };
}
const saCache: { current: TokenCache | null } = { current: null };

export interface DriveClient {
  getMeta(fileId: string): Promise<{ ok: true; meta: DriveFileMeta } | { ok: false; error: DriveError; detail?: string }>;
  /** Verdadeiro quando não há pasta raiz configurada ou o arquivo descende dela (até 10 níveis). */
  withinRoot(meta: DriveFileMeta): Promise<boolean>;
  /** Bytes do arquivo (alt=media) — devolve a Response da API para streaming. */
  download(fileId: string, range?: string | null): Promise<Response>;
  /** Miniatura gerada pelo Drive (requer o token; o link expira). */
  thumbnail(fileId: string, size: number): Promise<Response | null>;
  /** Conta autenticada (about.get) — e-mail e nome. */
  about(): Promise<{ ok: true; email: string; name: string } | { ok: false; error: DriveError; detail?: string }>;
  /** Itens diretos de uma pasta (não apagados), até `pageSize`. */
  listFolder(folderId: string, pageSize?: number): Promise<{ ok: true; items: DriveListItem[] } | { ok: false; error: DriveError; detail?: string }>;
  /** Subpasta com este nome exato dentro de `parentId` (não apagada), ou null. */
  findChildFolder(parentId: string, name: string): Promise<{ ok: true; id: string | null } | { ok: false; error: DriveError; detail?: string }>;
  /** Cria subpasta (exige escopo drive.file). */
  createFolder(parentId: string, name: string): Promise<{ ok: true; id: string } | { ok: false; error: DriveError; detail?: string }>;
  /** Upload resumível em uma sessão (metadados → Location → PUT do corpo). Devolve o que o Drive registrou. */
  upload(input: { parentId: string; name: string; mimeType: string; bytes: Uint8Array }): Promise<{ ok: true; file: DriveFileMeta } | { ok: false; error: DriveError; detail?: string }>;
}

/** Classifica uma resposta de erro da API em `DriveError` (lendo o `reason` do Google quando houver). */
export async function classifyApiError(res: Response): Promise<{ error: DriveError; detail: string }> {
  const text = (await res.text().catch(() => "")).slice(0, 400);
  const reason = text.match(/"reason":\s*"([^"]+)"/)?.[1] ?? "";
  if (res.status === 401) return { error: "revoked", detail: `http 401 ${reason}` };
  if (res.status === 404) return { error: "not_found", detail: `http 404 ${reason}` };
  if (res.status === 403) {
    if (/accessNotConfigured|SERVICE_DISABLED/i.test(text)) return { error: "api_disabled", detail: `http 403 ${reason}` };
    if (/insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(text)) return { error: "forbidden", detail: `http 403 escopo insuficiente` };
    return { error: "forbidden", detail: `http 403 ${reason}` };
  }
  return { error: "provider", detail: `http ${res.status} ${reason}` };
}

export function createDriveClient(cfg: { rootFolderId: string; token: TokenSource }, fetchImpl: typeof fetch = fetch): DriveClient {
  const authed = async (url: string, init: RequestInit = {}) => {
    const token = await cfg.token();
    return fetchImpl(url, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` }, signal: init.signal ?? AbortSignal.timeout(30_000) });
  };
  const failure = (e: unknown): { ok: false; error: DriveError; detail?: string } => {
    if (e instanceof DriveTokenError) return { ok: false, error: e.code, detail: e.message };
    return { ok: false, error: "network", detail: (e as Error).name };
  };
  const rawMeta = (fileId: string) => authed(`${API}/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(META_FIELDS)}&supportsAllDrives=true`);

  return {
    async getMeta(fileId) {
      let res: Response;
      try {
        res = await rawMeta(fileId);
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
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
      return authed(`${API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, { headers: range ? { Range: range } : {}, signal: AbortSignal.timeout(120_000) });
    },
    async thumbnail(fileId, size) {
      const res = await authed(`${API}/files/${encodeURIComponent(fileId)}?fields=thumbnailLink&supportsAllDrives=true`);
      if (!res.ok) return null;
      const d = (await res.json()) as { thumbnailLink?: string };
      if (!d.thumbnailLink) return null;
      const url = d.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
      return authed(url);
    },
    async about() {
      let res: Response;
      try {
        res = await authed(`${API}/about?fields=${encodeURIComponent("user(emailAddress,displayName)")}`);
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
      const d = (await res.json()) as { user?: { emailAddress?: string; displayName?: string } };
      return { ok: true, email: d.user?.emailAddress ?? "", name: d.user?.displayName ?? "" };
    },
    async findChildFolder(parentId, name) {
      const safe = name.replace(/['\\]/g, "");
      const q = `'${parentId.replace(/['\\]/g, "")}' in parents and name = '${safe}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
      const params = new URLSearchParams({ q, pageSize: "1", fields: "files(id)", supportsAllDrives: "true", includeItemsFromAllDrives: "true" });
      let res: Response;
      try {
        res = await authed(`${API}/files?${params}`);
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
      const d = (await res.json()) as { files?: Array<{ id: string }> };
      return { ok: true, id: d.files?.[0]?.id ?? null };
    },
    async createFolder(parentId, name) {
      let res: Response;
      try {
        res = await authed(`${API}/files?supportsAllDrives=true&fields=id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
        });
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
      const d = (await res.json()) as { id: string };
      return { ok: true, id: d.id };
    },
    async upload({ parentId, name, mimeType, bytes }) {
      let session: Response;
      try {
        session = await authed(`${UPLOAD_API}?uploadType=resumable&supportsAllDrives=true&fields=${encodeURIComponent(META_FIELDS)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": mimeType, "X-Upload-Content-Length": String(bytes.byteLength) },
          body: JSON.stringify({ name, mimeType, parents: [parentId] }),
        });
      } catch (e) {
        return failure(e);
      }
      if (!session.ok) return { ok: false, ...(await classifyApiError(session)) };
      const location = session.headers.get("Location");
      if (!location) return { ok: false, error: "provider", detail: "sessão de upload sem Location" };
      let res: Response;
      try {
        // Um único PUT: no servidor não há rede instável de navegador; a sessão permite retomar se precisar no futuro.
        res = await fetchImpl(location, { method: "PUT", headers: { "Content-Type": mimeType, "Content-Length": String(bytes.byteLength) }, body: new Blob([bytes as BlobPart]), signal: AbortSignal.timeout(600_000) });
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
      const d = (await res.json()) as { id: string; name: string; mimeType: string; size?: string; md5Checksum?: string; parents?: string[]; hasThumbnail?: boolean };
      return { ok: true, file: { id: d.id, name: d.name, mimeType: d.mimeType, size: d.size ? Number(d.size) : bytes.byteLength, md5: d.md5Checksum ?? null, trashed: false, parents: d.parents ?? [parentId], hasThumbnail: Boolean(d.hasThumbnail) } };
    },
    async listFolder(folderId, pageSize = 20) {
      const q = `'${folderId.replace(/['\\]/g, "")}' in parents and trashed = false`;
      const params = new URLSearchParams({ q, pageSize: String(Math.min(Math.max(pageSize, 1), 100)), fields: "files(id,name,mimeType,modifiedTime)", orderBy: "folder,name", supportsAllDrives: "true", includeItemsFromAllDrives: "true" });
      let res: Response;
      try {
        res = await authed(`${API}/files?${params}`);
      } catch (e) {
        return failure(e);
      }
      if (!res.ok) return { ok: false, ...(await classifyApiError(res)) };
      const d = (await res.json()) as { files?: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string }> };
      return { ok: true, items: (d.files ?? []).map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType, modifiedTime: f.modifiedTime ?? "", isFolder: f.mimeType === FOLDER_MIME })) };
    },
  };
}
