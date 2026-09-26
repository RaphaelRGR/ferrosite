import { getCurrentSession } from "@/lib/auth/session";
import { logEvent } from "@/lib/observability/log";
import { isOverseer } from "@/lib/portal/authz";
import { getMyProjectRole, getProjectBySlug } from "@/lib/portal/queries/projects";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { DriveError } from "./drive";
import { getDriveClient } from "./drive-connection";
import { ensureFolderPath, normalizeSegment, PROJECT_AREAS, projectPath, TOP_AREAS, type ProjectArea, type TopArea } from "./drive-folders";
import { EXTENSION_BY_MIME, extensionOf, safeFileName, sniffMime } from "./sniff";

/**
 * Upload Portal → Drive (DRIVE-003, 17/21). Ordem das defesas: sessão ativa →
 * permissão sobre o destino (projeto/missão pelo RLS; áreas institucionais só
 * coordenação) → tipo provado por magic bytes e coerente com a extensão →
 * allowlist (`uploadable`, tamanho) → pasta lógica → bytes ao Drive → registro
 * em `file_asset` já verificado (id/md5/tamanho do Drive) → vínculo. O banco
 * audita `file.uploaded`. Erros nunca expõem detalhes do provedor.
 */
export type UploadTarget =
  | { kind: "project"; slug: string; area: ProjectArea; missionId?: string }
  | { kind: "area"; area: TopArea; sub?: string }
  | { kind: "content"; itemId: string }
  | { kind: "work_item"; itemId: string };

export type UploadError =
  | "unauthenticated" | "forbidden" | "not_found" | "no_write_scope" | "unconfigured"
  | "unsupported_type" | "extension_mismatch" | "too_large" | "empty" | "invalid_target"
  | DriveError | "db";

type Classification = Database["public"]["Enums"]["classification"];
type Consent = Database["public"]["Enums"]["consent_status"];

export interface UploadInput {
  target: UploadTarget;
  originalName: string;
  bytes: Uint8Array;
  classification: Classification;
  consent: Consent;
  consentNote: string;
  credit: string;
  altText: string;
  altTextEn: string;
  /** Data para o nome seguro (importação usa a data do arquivo de origem). */
  stamp?: Date;
}

export interface UploadResult {
  fileId: string;
  driveId: string;
  path: string;
  name: string;
  mime: string;
  size: number;
}

export function parseTarget(fd: FormData): UploadTarget | null {
  const kind = String(fd.get("target") ?? "");
  if (kind === "project") {
    const slug = String(fd.get("project_slug") ?? "").trim();
    const area = String(fd.get("area") ?? "") as ProjectArea;
    const missionId = String(fd.get("mission_id") ?? "").trim() || undefined;
    if (!slug || !PROJECT_AREAS.includes(area)) return null;
    if (missionId && !/^[0-9a-f-]{36}$/.test(missionId)) return null;
    if (area === "missoes" && !missionId) return null;
    return { kind: "project", slug, area, missionId };
  }
  if (kind === "content") {
    const itemId = String(fd.get("item_id") ?? "").trim();
    return /^[0-9a-f-]{36}$/.test(itemId) ? { kind: "content", itemId } : null;
  }
  if (kind === "work_item") {
    const itemId = String(fd.get("item_id") ?? "").trim();
    return /^[0-9a-f-]{36}$/.test(itemId) ? { kind: "work_item", itemId } : null;
  }
  if (kind === "area") {
    const area = String(fd.get("area") ?? "") as TopArea;
    const sub = String(fd.get("sub") ?? "").trim() || undefined;
    if (!TOP_AREAS.includes(area)) return null;
    if (sub && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(sub)) return null;
    return { kind: "area", area, sub };
  }
  return null;
}

export async function uploadToDrive(input: UploadInput): Promise<{ ok: true; result: UploadResult } | { ok: false; error: UploadError; detail?: string }> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { ok: false, error: "unauthenticated" };
  const userId = s.user.id;
  const overseer = isOverseer(s.profile.global_role);
  const supabase = await createClient();

  // 1. destino e permissão (RLS decide o que o usuário enxerga)
  let parts: string[];
  let projectId: string | null = null;
  let contentItemId: string | null = null;
  let workItemId: string | null = null;
  if (input.target.kind === "work_item") {
    // ação (ACT-001): admin/coordenação ou o responsável; a RLS já esconde o item de quem não o vê
    const { data: item } = await supabase.from("work_item").select("id, owner_id, created_at").eq("id", input.target.itemId).maybeSingle();
    if (!item) return { ok: false, error: "not_found" };
    if (!overseer && item.owner_id !== userId) return { ok: false, error: "forbidden" };
    workItemId = item.id;
    parts = ["coordenacao", "acoes", item.created_at.slice(0, 4), item.id.replace(/-/g, "").slice(0, 8)];
  } else if (input.target.kind === "content") {
    // conteúdo: quem pode editá-lo (RLS de content_file) — autor em rascunho/revisão ou overseer
    const { data: item } = await supabase.from("content_item").select("id, type, slug, author_id, status").eq("id", input.target.itemId).maybeSingle();
    if (!item) return { ok: false, error: "not_found" };
    const editable = overseer || (item.author_id === userId && ["draft", "changes_requested", "review"].includes(item.status));
    if (!editable) return { ok: false, error: "forbidden" };
    contentItemId = item.id;
    parts = ["conteudos", normalizeSegment(item.type), normalizeSegment(item.slug)];
  } else if (input.target.kind === "project") {
    const project = await getProjectBySlug(input.target.slug);
    if (!project) return { ok: false, error: "not_found" };
    const role = await getMyProjectRole(project.id, userId);
    if (!overseer && (!role || role === "viewer")) return { ok: false, error: "forbidden" };
    if (input.target.missionId) {
      const { data: mission } = await supabase.from("mission").select("id, project_id").eq("id", input.target.missionId).maybeSingle();
      if (!mission || mission.project_id !== project.id) return { ok: false, error: "not_found" };
    }
    projectId = project.id;
    parts = projectPath(project.slug, input.target.area, input.target.missionId);
  } else {
    if (!overseer) return { ok: false, error: "forbidden" };
    parts = input.target.sub ? [input.target.area, input.target.sub] : [input.target.area];
  }

  // 2. tipo provado pelos bytes, extensão coerente, allowlist
  if (input.bytes.byteLength === 0) return { ok: false, error: "empty" };
  const mime = sniffMime(input.bytes);
  if (!mime) return { ok: false, error: "unsupported_type" };
  const ext = extensionOf(input.originalName);
  // sem extensão: os bytes decidem e o nome recebe a extensão canônica; com extensão errada: recusa (defesa contra renomeados)
  if (ext && !EXTENSION_BY_MIME[mime].includes(ext)) return { ok: false, error: "extension_mismatch", detail: mime };
  const { data: rule } = await supabase.from("file_type_allowlist").select("max_bytes, uploadable").eq("mime_type", mime).maybeSingle();
  if (!rule?.uploadable) return { ok: false, error: "unsupported_type", detail: mime };
  if (input.bytes.byteLength > rule.max_bytes) return { ok: false, error: "too_large", detail: String(rule.max_bytes) };

  // 3. conexão com escrita
  const conn = await getDriveClient();
  if (!conn) return { ok: false, error: "unconfigured" };
  if (!conn.canWrite) return { ok: false, error: "no_write_scope" };
  if (!conn.rootFolderId) return { ok: false, error: "unconfigured", detail: "sem pasta raiz" };

  // 4. pasta lógica + bytes
  const folder = await ensureFolderPath(conn.client, conn.rootFolderId, parts, userId);
  if (!folder.ok) return folder.error === "invalid_path" ? { ok: false, error: "invalid_target" } : { ok: false, error: folder.error, detail: folder.detail };
  const name = safeFileName(input.originalName, mime, input.stamp);
  const up = await conn.client.upload({ parentId: folder.id, name, mimeType: mime, bytes: input.bytes });
  if (!up.ok) return { ok: false, error: up.error, detail: up.detail };

  // 5. registro (RLS: dono = quem envia) — já verificado pelo provedor
  const { data: created, error } = await supabase
    .from("file_asset")
    .insert({
      provider: "google_drive",
      external_id: up.file.id,
      name,
      mime_type: mime,
      size_bytes: up.file.size,
      content_hash: up.file.md5,
      classification: input.classification,
      status: "verified",
      credit: input.credit,
      alt_text: input.altText,
      alt_text_en: input.altTextEn,
      consent: input.consent,
      consent_note: input.consentNote,
      storage_path: folder.path,
      drive_folder_id: folder.id,
      owner_id: userId,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (error || !created) {
    // bytes já no Drive: não ficam órfãos sem rastro
    logEvent("error", "file.upload_orphan", { driveId: up.file.id, path: folder.path, message: error?.message });
    return { ok: false, error: "db", detail: error?.message };
  }

  // 6. vínculo por destino (falha aqui não desfaz o registro: o arquivo existe e pode ser vinculado depois)
  if (workItemId) {
    const { error: linkErr } = await supabase.from("work_item_file").insert({ item_id: workItemId, file_id: created.id, linked_by: userId });
    if (linkErr) logEvent("warn", "file.link_failed", { fileId: created.id, workItemId, message: linkErr.message });
  } else if (contentItemId) {
    const { count } = await supabase.from("content_file").select("file_id", { count: "exact", head: true }).eq("item_id", contentItemId);
    const { error: linkErr } = await supabase.from("content_file").insert({ item_id: contentItemId, file_id: created.id, kind: "gallery", position: (count ?? 0) + 1, linked_by: userId });
    if (linkErr) logEvent("warn", "file.link_failed", { fileId: created.id, contentItemId, message: linkErr.message });
  } else if (projectId) {
    if (input.target.kind === "project" && input.target.missionId) {
      const { error: linkErr } = await supabase.from("mission_file").insert({ mission_id: input.target.missionId, file_id: created.id, kind: "attachment", linked_by: userId });
      if (linkErr) logEvent("warn", "file.link_failed", { fileId: created.id, missionId: input.target.missionId, message: linkErr.message });
    } else {
      const kind = input.target.kind === "project" ? ({ galeria: "gallery", documentos: "official_document", tecnico: "attachment", missoes: "attachment" } as const)[input.target.area] : "attachment";
      const { error: linkErr } = await supabase.from("project_file").insert({ project_id: projectId, file_id: created.id, kind, linked_by: userId });
      if (linkErr) logEvent("warn", "file.link_failed", { fileId: created.id, projectId, message: linkErr.message });
    }
  }
  return { ok: true, result: { fileId: created.id, driveId: up.file.id, path: folder.path, name, mime, size: up.file.size ?? input.bytes.byteLength } };
}
