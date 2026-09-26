import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/**
 * Leituras das ações (ACT-001) com o cliente de sessão: a RLS entrega tudo a
 * admin/coordenação e só os itens próprios (responsável/aprovador) aos demais.
 */
type PersonRef = Pick<Tables<"profile">, "id" | "full_name" | "email">;
export type WorkItemRow = Tables<"work_item"> & {
  owner: PersonRef | null;
  approver: PersonRef | null;
  decider: PersonRef | null;
  project: Pick<Tables<"project">, "slug" | "name"> | null;
  mission: (Pick<Tables<"mission">, "id" | "title"> & { project: Pick<Tables<"project">, "slug"> | null }) | null;
  organization: Pick<Tables<"organization">, "id" | "name"> | null;
};

const SELECT = [
  "*",
  "owner:owner_id (id, full_name, email)",
  "approver:approver_id (id, full_name, email)",
  "decider:decided_by (id, full_name, email)",
  "project:project_id (slug, name)",
  "mission:mission_id (id, title, project:project_id (slug))",
  "organization:organization_id (id, name)",
].join(", ");

export const personName = (p: Pick<PersonRef, "full_name" | "email"> | null | undefined) => (p ? p.full_name || p.email : "");

/** Todas as ações abertas visíveis (Minha Mesa, Coordenação). */
export async function listOpenWorkItems(): Promise<WorkItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_item").select(SELECT).not("status", "in", "(done,cancelled)").order("due_at", { ascending: true, nullsFirst: false }).limit(500);
  return (data ?? []) as unknown as WorkItemRow[];
}

/** Concluídas e canceladas mais recentes (as abas abertas filtram `listOpenWorkItems` com `filterTab`). */
export async function listClosedWorkItems(): Promise<WorkItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_item").select(SELECT).in("status", ["done", "cancelled"]).order("updated_at", { ascending: false }).limit(100);
  return (data ?? []) as unknown as WorkItemRow[];
}

export async function getWorkItem(id: string): Promise<WorkItemRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("work_item").select(SELECT).eq("id", id).maybeSingle();
  return (data as unknown as WorkItemRow | null) ?? null;
}

export type TimelineEntry =
  | { type: "event"; id: string; at: string; actor: PersonRef | null; kind: string; from: string | null; to: string | null; note: string }
  | { type: "comment"; id: string; at: string; actor: PersonRef | null; body: string };

/** Histórico automático + comentários numa linha do tempo única (mais antigo primeiro). */
export async function getWorkItemTimeline(id: string): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  const [events, comments] = await Promise.all([
    supabase.from("work_item_event").select("id, kind, from_value, to_value, note, occurred_at, actor:actor_id (id, full_name, email)").eq("item_id", id).order("occurred_at"),
    supabase.from("work_item_comment").select("id, body, created_at, author:author_id (id, full_name, email)").eq("item_id", id).order("created_at"),
  ]);
  type Ev = { id: number; kind: string; from_value: string | null; to_value: string | null; note: string; occurred_at: string; actor: PersonRef | null };
  type Cm = { id: string; body: string; created_at: string; author: PersonRef | null };
  const out: TimelineEntry[] = [
    ...((events.data ?? []) as unknown as Ev[]).map((e) => ({ type: "event" as const, id: `e${e.id}`, at: e.occurred_at, actor: e.actor, kind: e.kind, from: e.from_value, to: e.to_value, note: e.note })),
    ...((comments.data ?? []) as unknown as Cm[]).map((c) => ({ type: "comment" as const, id: c.id, at: c.created_at, actor: c.author, body: c.body })),
  ];
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export type WorkItemFileRow = { file_id: string; linked_at: string; file: Pick<Tables<"file_asset">, "id" | "name" | "mime_type" | "updated_at" | "storage_path" | "drive_folder_id"> | null };

export async function listWorkItemFiles(id: string): Promise<WorkItemFileRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_item_file").select("file_id, linked_at, file:file_id (id, name, mime_type, updated_at, storage_path, drive_folder_id)").eq("item_id", id).order("linked_at");
  return (data ?? []) as unknown as WorkItemFileRow[];
}

/** Quem pode receber ações no MVP: admin e coordenação ativos. */
export async function listAssignablePeople(): Promise<PersonRef[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("id, full_name, email").eq("status", "active").in("global_role", ["admin", "coordination"]).order("full_name");
  return (data ?? []) as PersonRef[];
}

/** Vínculos opcionais da criação ("Mais opções"). */
export async function listLinkOptions(): Promise<{ projects: Array<{ id: string; name: string }>; organizations: Array<{ id: string; name: string }> }> {
  const supabase = await createClient();
  const [projects, orgs] = await Promise.all([
    supabase.from("project").select("id, name").not("status", "in", "(archived,cancelled)").order("name").limit(200),
    supabase.from("organization").select("id, name").is("archived_at", null).order("name").limit(200),
  ]);
  return { projects: projects.data ?? [], organizations: orgs.data ?? [] };
}

/** Arquivos já registrados que podem ser vinculados (mais recentes primeiro). */
export async function listFileCandidates(): Promise<Array<{ id: string; label: string }>> {
  const supabase = await createClient();
  const { data } = await supabase.from("file_asset").select("id, name, storage_path").neq("status", "revoked").order("created_at", { ascending: false }).limit(150);
  return (data ?? []).map((f) => ({ id: f.id, label: f.storage_path ? `${f.name} · ${f.storage_path}` : f.name }));
}

/** Opções do "+ Criar": pessoas que podem receber ações e vínculos opcionais. */
export async function quickCreateOptions(me: string): Promise<{ me: string; people: Array<{ id: string; name: string }>; projects: Array<{ id: string; name: string }>; organizations: Array<{ id: string; name: string }> }> {
  const [people, links] = await Promise.all([listAssignablePeople(), listLinkOptions()]);
  return { me, people: people.map((p) => ({ id: p.id, name: personName(p) })), ...links };
}
