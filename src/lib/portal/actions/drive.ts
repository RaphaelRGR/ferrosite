"use server";

import { revalidatePath } from "next/cache";
import { FOLDER_MIME, parseDriveId, type DriveListItem } from "@/lib/files/drive";
import { disconnect, getDriveClient, recordCheck, setRootFolder } from "@/lib/files/drive-connection";
import { driveErrorMessage } from "@/lib/files/drive-errors";
import { requireDriveManager } from "@/lib/files/drive-guard";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionState } from "../action-state";

const PAGE = "/portal/configuracoes/integracoes";

export interface DriveTestState extends ActionState {
  account?: string;
  folder?: string;
  items?: DriveListItem[];
  checkedAt?: string;
  mode?: "oauth" | "service_account";
}

async function audit(action: string, diff: Record<string, string | number | boolean | null>) {
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: action, p_target_type: "drive_integration", p_target_id: "singleton", p_result: "ok", p_diff: diff });
}

/** Testar conexão (DRIVE-002): token válido (refresh se preciso), conta, pasta configurada e itens — só contagens vão ao banco. */
export async function testDriveConnection(): Promise<DriveTestState> {
  const guard = await requireDriveManager();
  if (!guard.ok) return { error: guard.reason };
  const conn = await getDriveClient();
  if (!conn) return { error: `db:${driveErrorMessage("unconfigured")}` };
  const about = await conn.client.about();
  if (!about.ok) {
    await recordCheck({ ok: false, step: "about", error: about.error }, about.error);
    return { error: `db:${driveErrorMessage(about.error)}` };
  }
  let folder = "";
  let items: DriveListItem[] = [];
  if (conn.rootFolderId) {
    const meta = await conn.client.getMeta(conn.rootFolderId);
    if (!meta.ok) {
      await recordCheck({ ok: false, step: "folder", error: meta.error }, meta.error);
      return { error: `db:${driveErrorMessage(meta.error)}`, account: about.email };
    }
    folder = meta.meta.name;
    const list = await conn.client.listFolder(conn.rootFolderId, 20);
    if (!list.ok) {
      await recordCheck({ ok: false, step: "list", error: list.error }, list.error);
      return { error: `db:${driveErrorMessage(list.error)}`, account: about.email, folder };
    }
    items = list.items;
  }
  const checkedAt = new Date().toISOString();
  await recordCheck({ ok: true, mode: conn.mode, folderConfigured: Boolean(conn.rootFolderId), items: items.length });
  await audit("drive.test", { ok: true, items: items.length });
  revalidatePath(PAGE);
  return { ok: true, account: about.email, folder, items, checkedAt, mode: conn.mode };
}

/** Definir a pasta raiz por id ou link; valida que é pasta acessível pela conta conectada. Vazio limpa. */
export async function setDriveFolder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const guard = await requireDriveManager();
  if (!guard.ok) return fail(fd, { error: guard.reason });
  const raw = String(fd.get("folder") ?? "").trim();
  if (raw === "") {
    if (!(await setRootFolder("", ""))) return fail(fd, { error: "server" });
    await audit("drive.folder_set", { folder: null });
    revalidatePath(PAGE);
    return { ok: true };
  }
  const id = parseDriveId(raw);
  if (!id) return fail(fd, { error: "invalid", field: "folder" });
  const conn = await getDriveClient();
  if (!conn) return fail(fd, { error: `db:${driveErrorMessage("unconfigured")}` });
  const meta = await conn.client.getMeta(id);
  if (!meta.ok) return fail(fd, { error: `db:${driveErrorMessage(meta.error)}` });
  if (meta.meta.mimeType !== FOLDER_MIME) return fail(fd, { error: `db:${driveErrorMessage("not_folder")}` });
  if (!(await setRootFolder(id, meta.meta.name))) return fail(fd, { error: "server" });
  await audit("drive.folder_set", { folder: id, name: meta.meta.name });
  revalidatePath(PAGE);
  return { ok: true };
}

/** Desconectar: revoga no Google (melhor esforço), zera tokens; nada no Drive é apagado. */
export async function disconnectDrive(): Promise<ActionState & { revokedAtGoogle?: boolean }> {
  const guard = await requireDriveManager();
  if (!guard.ok) return { error: guard.reason };
  const { revokedAtGoogle } = await disconnect();
  await audit("drive.disconnected", { revokedAtGoogle });
  revalidatePath(PAGE);
  return { ok: true, revokedAtGoogle };
}
