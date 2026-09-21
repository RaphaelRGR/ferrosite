import { logEvent } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createDriveClient, createServiceAccountTokenSource, DriveTokenError, readDriveEnv, type DriveClient } from "./drive";
import { decryptSecret, encryptSecret, readGoogleOAuthEnv, refreshAccessToken, revokeToken, type TokenSet } from "./google-oauth";

/**
 * Conexão institucional com o Drive (DRIVE-002): persistência da linha única
 * `drive_integration` (só service role) e a origem de token para o cliente.
 * Prioridade: conexão OAuth conectada → conta de serviço por variáveis → nada.
 * O access token é renovado pelo refresh token quando faltam < 60 s; se o
 * Google responder `invalid_grant`, a conexão vira `revoked` (reconectar).
 */
type Row = Database["public"]["Tables"]["drive_integration"]["Row"];
export type DriveConnectionStatus = Database["public"]["Enums"]["drive_connection_status"];

export interface DriveStatus {
  status: DriveConnectionStatus;
  accountEmail: string;
  accountName: string;
  scope: string;
  rootFolderId: string;
  rootFolderName: string;
  connectedBy: string | null;
  connectedAt: string | null;
  lastCheckedAt: string | null;
  lastCheckResult: Record<string, unknown>;
  lastError: string;
}

/** Estado sem segredos, pela função restrita a admin/coordenação (RLS decide, não a UI). */
export async function getDriveStatus(): Promise<DriveStatus | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("drive_integration_status");
  const r = data?.[0];
  if (!r) return null;
  return {
    status: r.status, accountEmail: r.provider_account_email, accountName: r.provider_account_name, scope: r.scope,
    rootFolderId: r.root_folder_id, rootFolderName: r.root_folder_name, connectedBy: r.connected_by ?? null, connectedAt: r.connected_at ?? null,
    lastCheckedAt: r.last_checked_at ?? null, lastCheckResult: (r.last_check_result as Record<string, unknown>) ?? {}, lastError: r.last_error,
  };
}

async function loadRow(): Promise<Row | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin.from("drive_integration").select("*").eq("singleton", true).maybeSingle();
  return data ?? null;
}

async function patchRow(patch: Database["public"]["Tables"]["drive_integration"]["Update"]): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin.from("drive_integration").update(patch).eq("singleton", true);
  if (error) logEvent("error", "drive.persist_failed", { message: error.message });
  return !error;
}

export async function saveConnection(input: { tokens: TokenSet; email: string; name: string; userId: string; rootFolderId?: string }): Promise<boolean> {
  return patchRow({
    status: "connected",
    provider_account_email: input.email,
    provider_account_name: input.name,
    scope: input.tokens.scope,
    access_token_enc: encryptSecret(input.tokens.accessToken),
    refresh_token_enc: encryptSecret(input.tokens.refreshToken),
    access_token_expires_at: new Date(input.tokens.expiresAt).toISOString(),
    connected_by: input.userId,
    connected_at: new Date().toISOString(),
    last_error: "",
    last_check_result: {},
    last_checked_at: null,
    ...(input.rootFolderId !== undefined ? { root_folder_id: input.rootFolderId } : {}),
  });
}

export async function markRevoked(detail: string): Promise<void> {
  await patchRow({ status: "revoked", access_token_enc: "", access_token_expires_at: null, last_error: detail.slice(0, 300) });
}

/** Desconecta: revoga no Google (melhor esforço) e zera tokens/estado. Nada no Drive é apagado. */
export async function disconnect(): Promise<{ revokedAtGoogle: boolean }> {
  const row = await loadRow();
  let revokedAtGoogle = false;
  if (row) {
    const refresh = decryptSecret(row.refresh_token_enc) || decryptSecret(row.access_token_enc);
    if (refresh) revokedAtGoogle = await revokeToken(refresh);
  }
  await patchRow({
    status: "disconnected", provider_account_email: "", provider_account_name: "", scope: "",
    access_token_enc: "", refresh_token_enc: "", access_token_expires_at: null,
    connected_by: null, connected_at: null, last_checked_at: null, last_check_result: {}, last_error: "",
  });
  return { revokedAtGoogle };
}

export async function setRootFolder(id: string, name: string): Promise<boolean> {
  return patchRow({ root_folder_id: id, root_folder_name: name });
}

export async function recordCheck(result: Record<string, string | number | boolean | null>, error = ""): Promise<void> {
  await patchRow({ last_checked_at: new Date().toISOString(), last_check_result: result, last_error: error.slice(0, 300) });
}

/** Pasta raiz efetiva: a do banco; sem ela, a semente `GOOGLE_DRIVE_ROOT_FOLDER_ID` (centralizada aqui). */
export function effectiveRootFolder(row: Pick<Row, "root_folder_id"> | null): string {
  return row?.root_folder_id || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
}

function oauthTokenSource(row: Row) {
  return async (): Promise<string> => {
    const cfg = readGoogleOAuthEnv();
    if (!cfg) throw new DriveTokenError("unconfigured", "GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI ausentes");
    const expiresAt = row.access_token_expires_at ? Date.parse(row.access_token_expires_at) : 0;
    const access = decryptSecret(row.access_token_enc);
    if (access && expiresAt > Date.now() + 60_000) return access;
    const refresh = decryptSecret(row.refresh_token_enc);
    if (!refresh) {
      await markRevoked("sem refresh token (chave de cifra mudou ou conexão incompleta)");
      throw new DriveTokenError("revoked", "sem refresh token");
    }
    const r = await refreshAccessToken(cfg, refresh);
    if (!r.ok) {
      if (r.error === "invalid_grant") {
        await markRevoked("autorização revogada no Google (invalid_grant)");
        throw new DriveTokenError("revoked", "invalid_grant");
      }
      throw new DriveTokenError(r.error === "network" ? "network" : "provider", r.detail);
    }
    row.access_token_enc = encryptSecret(r.accessToken);
    row.access_token_expires_at = new Date(r.expiresAt).toISOString();
    await patchRow({ access_token_enc: row.access_token_enc, access_token_expires_at: row.access_token_expires_at, status: "connected", last_error: "" });
    return r.accessToken;
  };
}

/** Como o Portal está falando com o Drive (para UI/health), sem segredos. */
export type DriveMode = "oauth" | "service_account" | "none";

export async function getDriveClient(): Promise<{ client: DriveClient; mode: Exclude<DriveMode, "none">; rootFolderId: string } | null> {
  const row = await loadRow();
  const rootFolderId = effectiveRootFolder(row);
  if (row?.status === "connected" && row.refresh_token_enc) {
    return { client: createDriveClient({ rootFolderId, token: oauthTokenSource(row) }), mode: "oauth", rootFolderId };
  }
  const sa = readDriveEnv();
  if (sa) return { client: createDriveClient({ rootFolderId: rootFolderId || sa.rootFolderId, token: createServiceAccountTokenSource(sa) }), mode: "service_account", rootFolderId: rootFolderId || sa.rootFolderId };
  return null;
}
