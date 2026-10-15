"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { LOCALES, localizePath } from "@/i18n/config";
import { parseDriveId } from "@/lib/files/drive";
import { driveErrorMessage } from "@/lib/files/drive-errors";
import { importBatch, type ImportBatchResult } from "@/lib/files/import";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { isOverseer, slugify } from "@/lib/portal/authz";
import { composeExperienceTitle, EXPERIENCE_KINDS, photoAltFromName, type ExperienceFormKind } from "@/lib/portal/experiences";

/**
 * Experiências pelo Portal (EXP-001): admin/coordenação criam, importam a pasta de fotos do Drive,
 * escolhem capa, ocultam fotos e publicam direto (`publish_experience`, sem segunda aprovação, por
 * decisão do usuário). Quem decide é o banco (RLS + triggers); aqui validamos cedo e invalidamos o site.
 */
async function overseer(): Promise<{ userId: string; name: string } | ActionState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  if (!isOverseer(s.profile.global_role)) return { error: "forbidden" };
  return { userId: s.user.id, name: s.profile.full_name || s.profile.email };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 20000) => String(fd.get(key) ?? "").trim().slice(0, max);
const uuid = (v: string) => (/^[0-9a-f-]{36}$/.test(v) ? v : null);

const PORTAL = "/portal/experiencias";

/** Site: Home, hub e página da experiência nas duas línguas. */
function revalidateSite(slug?: string) {
  for (const l of LOCALES) {
    revalidatePath(localizePath(l, "/"));
    revalidatePath(localizePath(l, "/experiencias"));
    if (slug) revalidatePath(localizePath(l, `/experiencias/${slug}`));
  }
}

function readFields(fd: FormData): { fields: Record<string, unknown>; title: string } | ActionState {
  const kind = str(fd, "kind") as ExperienceFormKind;
  if (!EXPERIENCE_KINDS.includes(kind)) return { error: "invalid", field: "kind" };
  const name = str(fd, "name", 180);
  if (name.length < 2) return { error: "invalid", field: "name" };
  const date = str(fd, "date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "invalid", field: "date" };
  const folderRaw = str(fd, "folder", 512);
  const folder = folderRaw ? parseDriveId(folderRaw) : "";
  if (folder === null) return { error: "invalid", field: "folder" };
  const title = composeExperienceTitle(kind, name).slice(0, 200);
  return {
    title,
    fields: {
      title,
      // meio-dia no fuso do curso: a data não "volta um dia" em nenhum fuso de leitura
      event_at: `${date}T12:00:00-03:00`,
      event_place: str(fd, "place", 200),
      summary: str(fd, "summary", 500),
      body_md: str(fd, "body_md", 20000),
      project_id: uuid(str(fd, "project_id")),
      photo_folder_id: folder,
    },
  };
}

export async function createExperience(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const who = await overseer();
  if (isState(who)) return fail(fd, who);
  const parsed = readFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  if (parsed.fields.photo_folder_id && fd.get("authorized") !== "on") return fail(fd, { error: "invalid", field: "authorized" });
  const year = String(parsed.fields.event_at).slice(0, 4);
  const base = slugify(parsed.title.includes(year) ? parsed.title : `${parsed.title} ${year}`).slice(0, 80).replace(/-+$/, "");
  const supabase = await createClient();
  let id: string | null = null;
  for (const slug of [base, `${base}-2`, `${base}-3`]) {
    const { data, error } = await supabase
      .from("content_item")
      .insert({ ...parsed.fields, type: "experience", locale: "pt", slug, consent_confirmed: fd.get("authorized") === "on", source_note: authorizationNote(who.name), author_id: who.userId, updated_by: who.userId } as never)
      .select("id")
      .single();
    if (!error) {
      id = data.id;
      break;
    }
    if (error.code !== "23505") return fail(fd, { error: dbError(error) });
  }
  if (!id) return fail(fd, { error: "db:já existe uma experiência com esse nome e ano" });
  revalidatePath(PORTAL);
  redirect(`${PORTAL}/${id}${parsed.fields.photo_folder_id ? "?importar=1" : ""}`);
}

export async function updateExperience(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const who = await overseer();
  if (isState(who)) return fail(fd, who);
  const parsed = readFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_item").update({ ...parsed.fields, updated_by: who.userId } as never).eq("id", id).eq("type", "experience").eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

function authorizationNote(name: string) {
  return `Uso das fotos no site autorizado por ${name} ao cadastrar a experiência (${new Date().toISOString().slice(0, 10)}).`.slice(0, 500);
}

export interface PhotoImportState extends ActionState {
  result?: ImportBatchResult;
}

/** Um lote da importação da pasta de fotos da experiência; o navegador repete com `cursor = result.next`. */
export async function importExperiencePhotos(_prev: PhotoImportState, fd: FormData): Promise<PhotoImportState> {
  const id = uuid(str(fd, "id"));
  const cursor = Number(fd.get("cursor") ?? 0);
  if (!id || !Number.isInteger(cursor) || cursor < 0) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { data: item } = await supabase.from("content_item").select("id, title, photo_folder_id").eq("id", id).eq("type", "experience").maybeSingle();
  if (!item) return { error: "not_found" };
  if (!item.photo_folder_id) return { error: "invalid", field: "folder" };
  // autorização declarada a cada importação (na criação ela já foi exigida); sem ela, as fotos entram
  // internas e podem ser liberadas uma a uma depois
  const authorized = fd.get("authorized") === "1";
  const r = await importBatch({
    sourceFolderId: item.photo_folder_id,
    target: { kind: "content", itemId: id },
    cursor,
    limit: 5,
    classification: authorized ? "public" : "internal",
    consent: authorized ? "granted" : "pending",
    consentNote: authorized ? authorizationNote(who.name) : "",
    credit: "",
    altText: (name, n) => photoAltFromName(name, item.title, n),
  });
  if (!r.ok) return { error: r.error === "unauthenticated" || r.error === "forbidden" ? r.error : `db:${driveErrorMessage(r.error === "invalid_source" ? "not_found" : r.error)}` };
  if (r.result.next === null) revalidatePath(`${PORTAL}/${id}`);
  return { ok: true, result: r.result };
}

/** Capa = uma das fotos da galeria (o banco exige consentimento confirmado para publicar com capa). */
export async function setExperienceCover(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  const fileId = uuid(str(fd, "file_id"));
  if (!id || !fileId) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase.from("content_item").update({ cover_file_id: fileId, updated_by: who.userId }).eq("id", id).eq("type", "experience");
  if (error) return { error: dbError(error) };
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

/** Ocultar/mostrar no site: só o vínculo `gallery` é publicado; `attachment` fica interno. */
export async function toggleExperiencePhoto(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  const fileId = uuid(str(fd, "file_id"));
  const show = fd.get("show") === "1";
  if (!id || !fileId) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase.from("content_file").update({ kind: show ? "gallery" : "attachment" }).eq("item_id", id).eq("file_id", fileId);
  if (error) return { error: dbError(error) };
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

/** Liberar para o site uma foto interna (sem autorização registrada): quem libera declara a autorização. */
export async function releaseExperiencePhoto(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  const fileId = uuid(str(fd, "file_id"));
  if (!id || !fileId) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase
    .from("file_asset")
    .update({ classification: "public", consent: "granted", consent_note: authorizationNote(who.name), updated_by: who.userId })
    .eq("id", fileId)
    .eq("status", "verified");
  if (error) return { error: dbError(error) };
  // garante o vínculo de galeria: a foto entra no site na próxima "Atualizar no site"
  await supabase.from("content_file").update({ kind: "gallery" }).eq("item_id", id).eq("file_id", fileId);
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

/** Descrição da foto (texto alternativo lido por leitores de tela e mostrado na galeria). */
export async function setExperiencePhotoAlt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  const fileId = uuid(str(fd, "file_id"));
  if (!id || !fileId) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase.from("file_asset").update({ alt_text: str(fd, "alt", 300), updated_by: who.userId }).eq("id", fileId);
  if (error) return { error: dbError(error) };
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

export async function publishExperience(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  if (!id) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_experience", { p_item: id });
  if (error) return { error: dbError(error) };
  const { data } = await supabase.from("content_item").select("slug").eq("id", id).maybeSingle();
  revalidateSite(data?.slug);
  revalidatePath(PORTAL);
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}

export async function unpublishExperience(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = uuid(str(fd, "id"));
  if (!id) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { error } = await supabase.rpc("unpublish_content", { p_item: id, p_reason: "tirada do site pela tela de experiências" });
  if (error) return { error: dbError(error) };
  const { data } = await supabase.from("content_item").select("slug").eq("id", id).maybeSingle();
  revalidateSite(data?.slug);
  revalidatePath(PORTAL);
  revalidatePath(`${PORTAL}/${id}`);
  return { ok: true };
}
