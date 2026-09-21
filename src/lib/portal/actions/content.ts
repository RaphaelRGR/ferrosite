"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { parseDriveId } from "@/lib/files/drive";
import { driveErrorMessage } from "@/lib/files/drive-errors";
import { getDriveClient } from "@/lib/files/drive-connection";
import { dispatchQuietly } from "@/lib/mail/dispatch";
import { getCurrentSession } from "@/lib/auth/session";
import { LOCALES, localizePath } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "../action-state";
import { isOverseer, SLUG_RE, slugify } from "../authz";
import {
  APPROVER_TARGETS, CONSENT_STATUSES, CONTENT_STATUSES, CONTENT_TRANSITIONS, CONTENT_TYPE_PUBLIC_PATH, CONTENT_TYPES, FILE_LINK_KINDS, FILE_MIME_TYPES, FILE_PROVIDERS, FILE_STATUSES,
  type ConsentStatus, type ContentStatus, type ContentType, type FileLinkKind, type FileProvider, type FileStatus,
} from "../content-constants";
import { getContent, getFile } from "../content";

/**
 * Server Actions de conteúdo (PUB-001) e arquivos (FILE-001). O fluxo de
 * aprovação e a projeção pública são decididos pelo banco (triggers/funções);
 * aqui validamos cedo, cuidamos da versão e invalidamos o cache do site.
 */
async function session(): Promise<{ userId: string; role: string } | ActionState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  return { userId: s.user.id, role: s.profile.global_role };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 20000) => String(fd.get(key) ?? "").trim().slice(0, max);
const dateTimeOrNull = (v: string) => (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00-03:00` : null);

/** Invalida as páginas públicas que consomem a projeção (18: cache invalidado). */
function revalidatePublic(type: ContentType, slug?: string) {
  const path = CONTENT_TYPE_PUBLIC_PATH[type];
  if (!path) return;
  for (const l of LOCALES) {
    revalidatePath(localizePath(l, path));
    if (slug) revalidatePath(localizePath(l, `${path}/${slug}`));
  }
}

function readContentFields(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const type = str(fd, "type") as ContentType;
  if (!CONTENT_TYPES.includes(type)) return { error: "invalid", field: "type" };
  const locale = str(fd, "locale");
  if (locale !== "pt" && locale !== "en") return { error: "invalid", field: "locale" };
  const title = str(fd, "title", 200);
  if (title.length < 2) return { error: "invalid", field: "title" };
  const slug = slugify(str(fd, "slug", 80) || title);
  if (!SLUG_RE.test(slug)) return { error: "invalid", field: "slug" };
  const event_at = dateTimeOrNull(str(fd, "event_at", 16));
  if (type === "event" && !event_at) return { error: "invalid", field: "event_at" };
  return {
    fields: {
      type,
      locale,
      title,
      slug,
      summary: str(fd, "summary", 500),
      body_md: str(fd, "body_md", 20000),
      event_at,
      event_place: str(fd, "event_place", 200),
      project_id: str(fd, "project_id") || null,
      cover_file_id: str(fd, "cover_file_id") || null,
      source_note: str(fd, "source_note", 500),
      consent_confirmed: fd.get("consent_confirmed") === "on",
    },
  };
}

export async function createContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const parsed = readContentFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_item").insert({ ...parsed.fields, author_id: s.userId, updated_by: s.userId } as never).select("id").single();
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath("/portal/conteudos");
  redirect(`/portal/conteudos/${data.id}`);
}

export async function updateContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const parsed = readContentFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_item").update({ ...parsed.fields, updated_by: s.userId } as never).eq("id", id).eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/conteudos/${id}`);
  return { ok: true };
}

/** Transições por UPDATE (revisão, alterações, aprovado, agendado, rascunho, arquivado); publicar/despublicar via função. */
export async function transitionContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  const from = str(fd, "from") as ContentStatus;
  const to = str(fd, "to") as ContentStatus;
  const comment = str(fd, "comment", 2000);
  if (!id || !Number.isInteger(version) || !CONTENT_STATUSES.includes(from) || !CONTENT_STATUSES.includes(to)) return fail(fd, { error: "invalid" });
  if (!CONTENT_TRANSITIONS[from].includes(to)) return fail(fd, { error: "invalid", field: "to" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  if (APPROVER_TARGETS.includes(to) && !isOverseer(s.role as never)) return fail(fd, { error: "forbidden" });
  const item = await getContent(id);
  if (!item) return fail(fd, { error: "not_found" });
  const supabase = await createClient();

  if (to === "published") {
    const { error } = await supabase.rpc("publish_content", { p_item: id });
    if (error) return fail(fd, { error: dbError(error) });
    revalidatePublic(item.type, item.slug);
  } else if (to === "unpublished") {
    const { error } = await supabase.rpc("unpublish_content", { p_item: id, p_reason: comment });
    if (error) return fail(fd, { error: dbError(error) });
    revalidatePublic(item.type, item.slug);
  } else {
    const patch: Record<string, unknown> = { status: to, updated_by: s.userId };
    if (to === "scheduled") {
      const at = dateTimeOrNull(str(fd, "scheduled_for", 16));
      if (!at) return fail(fd, { error: "invalid", field: "scheduled_for" });
      patch.scheduled_for = at;
    }
    const { data, error } = await supabase.from("content_item").update(patch as never).eq("id", id).eq("version", version).select("id");
    if (error) return fail(fd, { error: dbError(error) });
    if (!data?.length) return fail(fd, { error: "conflict" });
    // Registro de revisão/aprovação (18): pedido ao enviar para revisão; decisão ao aprovar/solicitar alterações.
    if (to === "review") {
      const rev = await supabase.from("content_revision").select("id").eq("item_id", id).order("revision_no", { ascending: false }).limit(1).maybeSingle();
      if (rev.data) await supabase.from("approval_request").insert({ item_id: id, revision_id: rev.data.id, requested_by: s.userId, comment });
    } else if (to === "approved" || to === "changes_requested") {
      const pending = await supabase.from("approval_request").select("id").eq("item_id", id).eq("decision", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (pending.data) {
        await supabase.from("approval_request").update({ decision: to === "approved" ? "approved" : "changes_requested", reviewer_id: s.userId, comment, decided_at: new Date().toISOString() }).eq("id", pending.data.id);
      }
    }
  }
  revalidatePath(`/portal/conteudos/${id}`);
  revalidatePath("/portal/conteudos");
  after(dispatchQuietly); // avisos de revisão/decisão/publicação enfileirados pelo banco (MAIL-001)
  return { ok: true };
}

export async function rollbackContent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const revisionId = str(fd, "revision_id");
  if (!id || !revisionId) return fail(fd, { error: "invalid" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  if (!isOverseer(s.role as never)) return fail(fd, { error: "forbidden" });
  const item = await getContent(id);
  if (!item) return fail(fd, { error: "not_found" });
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_content", { p_item: id, p_revision: revisionId });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePublic(item.type, item.slug);
  revalidatePath(`/portal/conteudos/${id}`);
  return { ok: true };
}

// ─── Arquivos (FILE-001) ───────────────────────────────────────────────────
export async function registerFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const provider = str(fd, "provider") as FileProvider;
  const externalId = str(fd, "external_id", 512);
  const name = str(fd, "name", 255);
  const mime = str(fd, "mime_type", 100);
  const size = str(fd, "size_bytes", 20);
  if (!FILE_PROVIDERS.includes(provider)) return fail(fd, { error: "invalid", field: "provider" });
  if (!externalId) return fail(fd, { error: "invalid", field: "external_id" });
  if (provider === "external_link" && !/^https:\/\//.test(externalId)) return fail(fd, { error: "invalid", field: "external_id" });
  // Drive: aceita o link de compartilhamento e guarda só o fileId (DRIVE-001).
  const driveId = provider === "google_drive" ? parseDriveId(externalId) : null;
  if (provider === "google_drive" && !driveId) return fail(fd, { error: "invalid", field: "external_id" });
  if (!name) return fail(fd, { error: "invalid", field: "name" });
  if (!(FILE_MIME_TYPES as readonly string[]).includes(mime)) return fail(fd, { error: "invalid", field: "mime_type" });
  if (size && !/^\d{1,12}$/.test(size)) return fail(fd, { error: "invalid", field: "size_bytes" });
  const consent = str(fd, "consent") as ConsentStatus;
  if (!CONSENT_STATUSES.includes(consent)) return fail(fd, { error: "invalid", field: "consent" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_asset")
    .insert({
      provider,
      external_id: driveId ?? externalId,
      name,
      mime_type: mime,
      size_bytes: size ? Number(size) : null,
      credit: str(fd, "credit", 200),
      alt_text: str(fd, "alt_text", 300),
      alt_text_en: str(fd, "alt_text_en", 300),
      consent,
      consent_note: str(fd, "consent_note", 500),
      owner_id: s.userId,
      created_by: s.userId,
      updated_by: s.userId,
    })
    .select("id")
    .single();
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath("/portal/arquivos");
  redirect(`/portal/arquivos/${data.id}`);
}

/**
 * Verificação no Drive (DRIVE-001): confere existência, lixeira, pasta
 * institucional (quando definida) e allowlist; grava nome/MIME/tamanho/hash do
 * provedor e marca `verified` (trigger audita quem/quando/hash). O RLS decide
 * quem pode editar; a credencial nunca sai do servidor.
 */
export async function verifyFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const file = await getFile(id);
  if (!file) return fail(fd, { error: "not_found" });
  if (file.provider !== "google_drive") return fail(fd, { error: "db:só arquivos do Google Drive são verificados automaticamente" });
  const conn = await getDriveClient();
  if (!conn) return fail(fd, { error: "db:Google Drive não conectado (Configurações → Integrações)" });
  const meta = await conn.client.getMeta(file.external_id);
  if (!meta.ok) return fail(fd, { error: `db:${driveErrorMessage(meta.error)}` });
  if (!(await conn.client.withinRoot(meta.meta))) return fail(fd, { error: "db:arquivo fora da pasta institucional configurada" });
  if (!(FILE_MIME_TYPES as readonly string[]).includes(meta.meta.mimeType)) return fail(fd, { error: `db:tipo no Drive não permitido: ${meta.meta.mimeType}` });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_asset")
    .update({ name: meta.meta.name.slice(0, 255), mime_type: meta.meta.mimeType, size_bytes: meta.meta.size, content_hash: meta.meta.md5, status: "verified", updated_by: s.userId })
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/arquivos/${id}`);
  revalidatePath("/portal/arquivos");
  return { ok: true };
}

export async function updateFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const status = str(fd, "status") as FileStatus;
  const consent = str(fd, "consent") as ConsentStatus;
  if (!FILE_STATUSES.includes(status) || !CONSENT_STATUSES.includes(consent)) return fail(fd, { error: "invalid" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_asset")
    .update({ status, consent, consent_note: str(fd, "consent_note", 500), credit: str(fd, "credit", 200), alt_text: str(fd, "alt_text", 300), alt_text_en: str(fd, "alt_text_en", 300), updated_by: s.userId })
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/arquivos/${id}`);
  revalidatePath("/portal/arquivos");
  return { ok: true };
}

export async function linkProjectFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = str(fd, "project_id");
  const slug = str(fd, "slug");
  const fileId = str(fd, "file_id");
  const kind = str(fd, "kind") as FileLinkKind;
  const op = str(fd, "op") || "link";
  if (!projectId || !fileId || !FILE_LINK_KINDS.includes(kind)) return fail(fd, { error: "invalid" });
  const s = await session();
  if (isState(s)) return fail(fd, s);
  const supabase = await createClient();
  const { error } =
    op === "unlink"
      ? await supabase.from("project_file").delete().eq("project_id", projectId).eq("file_id", fileId)
      : await supabase.from("project_file").upsert({ project_id: projectId, file_id: fileId, kind, linked_by: s.userId }, { onConflict: "project_id,file_id" });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath(`/portal/projetos/${slug}/arquivos`);
  return { ok: true };
}
