import { createClient } from "@/lib/supabase/server";

/**
 * Leituras da tela de experiências (EXP-001), com o cliente de sessão: a RLS de content_item e
 * content_file decide (admin/coordenação veem tudo).
 */
const ITEM_FIELDS = "id, slug, title, status, event_at, event_place, summary, body_md, project_id, cover_file_id, consent_confirmed, photo_folder_id, version, updated_at";

export interface ExperienceRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  event_at: string | null;
  event_place: string;
  summary: string;
  body_md: string;
  project_id: string | null;
  cover_file_id: string | null;
  consent_confirmed: boolean;
  photo_folder_id: string;
  version: number;
  updated_at: string;
}

export type SiteState = "draft" | "live" | "live_pending";

export interface ExperienceListItem extends ExperienceRow {
  photos: number;
  site: SiteState;
}

/** Fora do site / no site / no site com mudanças (capa, galeria ou texto mexidos voltam o item a rascunho). */
export function siteState(status: string, live: boolean): SiteState {
  if (!live) return "draft";
  return status === "published" ? "live" : "live_pending";
}

export async function listExperiences(): Promise<ExperienceListItem[]> {
  const supabase = await createClient();
  const { data: items } = await supabase.from("content_item").select(ITEM_FIELDS).eq("type", "experience").eq("locale", "pt").neq("status", "archived").order("event_at", { ascending: false, nullsFirst: false });
  const rows = (items ?? []) as ExperienceRow[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [links, pubs] = await Promise.all([
    supabase.from("content_file").select("item_id").in("item_id", ids).eq("kind", "gallery"),
    supabase.from("publication").select("item_id").in("item_id", ids).is("unpublished_at", null),
  ]);
  const count = new Map<string, number>();
  for (const l of links.data ?? []) count.set(l.item_id, (count.get(l.item_id) ?? 0) + 1);
  const live = new Set((pubs.data ?? []).map((p) => p.item_id));
  return rows.map((r) => ({ ...r, photos: count.get(r.id) ?? 0, site: siteState(r.status, live.has(r.id)) }));
}

export interface ExperiencePhoto {
  fileId: string;
  name: string;
  alt: string;
  shown: boolean;
  position: number;
}

export async function getExperience(id: string): Promise<{ item: ExperienceRow; photos: ExperiencePhoto[]; site: SiteState } | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("content_item").select(ITEM_FIELDS).eq("id", id).eq("type", "experience").maybeSingle();
  if (!data) return null;
  const item = data as ExperienceRow;
  const [links, pub] = await Promise.all([
    supabase.from("content_file").select("file_id, kind, position, linked_at, file:file_id (id, name, alt_text, status, mime_type)").eq("item_id", id).order("position").order("linked_at"),
    supabase.from("publication").select("id").eq("item_id", id).is("unpublished_at", null).limit(1),
  ]);
  type Link = { file_id: string; kind: string; position: number; file: { id: string; name: string; alt_text: string; status: string; mime_type: string } | null };
  const photos = ((links.data ?? []) as unknown as Link[])
    .filter((l) => l.file && l.file.status !== "revoked" && l.file.mime_type.startsWith("image/") && (l.kind === "gallery" || l.kind === "attachment"))
    .map((l) => ({ fileId: l.file_id, name: l.file!.name, alt: l.file!.alt_text, shown: l.kind === "gallery", position: l.position }));
  return { item, photos, site: siteState(item.status, (pub.data ?? []).length > 0) };
}
