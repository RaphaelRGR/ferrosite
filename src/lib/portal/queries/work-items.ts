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
  checklist: Array<{ done: boolean }>;
  process: Pick<Tables<"work_process">, "id" | "title"> | null;
};

const SELECT = [
  "*",
  "owner:owner_id (id, full_name, email)",
  "approver:approver_id (id, full_name, email)",
  "decider:decided_by (id, full_name, email)",
  "project:project_id (slug, name)",
  "mission:mission_id (id, title, project:project_id (slug))",
  "organization:organization_id (id, name)",
  "checklist:work_item_checklist_item (done)",
  "process:process_id (id, title)",
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
  | { type: "event"; id: string; at: string; actor: PersonRef | null; actorId: string | null; kind: string; from: string | null; to: string | null; note: string }
  | { type: "comment"; id: string; at: string; actor: PersonRef | null; authorId: string; body: string; mentions: string[] };

/** Histórico automático + comentários numa linha do tempo única (mais antigo primeiro). */
export async function getWorkItemTimeline(id: string): Promise<TimelineEntry[]> {
  const supabase = await createClient();
  const [events, comments] = await Promise.all([
    supabase.from("work_item_event").select("id, kind, from_value, to_value, note, occurred_at, actor_id, actor:actor_id (id, full_name, email)").eq("item_id", id).order("occurred_at"),
    supabase.from("work_item_comment").select("id, body, mentions, created_at, author_id, author:author_id (id, full_name, email)").eq("item_id", id).order("created_at"),
  ]);
  type Ev = { id: number; kind: string; from_value: string | null; to_value: string | null; note: string; occurred_at: string; actor_id: string | null; actor: PersonRef | null };
  type Cm = { id: string; body: string; mentions: string[]; created_at: string; author_id: string; author: PersonRef | null };
  const out: TimelineEntry[] = [
    ...((events.data ?? []) as unknown as Ev[]).map((e) => ({ type: "event" as const, id: `e${e.id}`, at: e.occurred_at, actor: e.actor, actorId: e.actor_id, kind: e.kind, from: e.from_value, to: e.to_value, note: e.note })),
    ...((comments.data ?? []) as unknown as Cm[]).map((c) => ({ type: "comment" as const, id: c.id, at: c.created_at, actor: c.author, authorId: c.author_id, body: c.body, mentions: c.mentions ?? [] })),
  ];
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export type WorkItemFileRow = { file_id: string; linked_at: string; file: Pick<Tables<"file_asset">, "id" | "name" | "mime_type" | "updated_at" | "storage_path" | "drive_folder_id"> | null };

export async function listWorkItemFiles(id: string): Promise<WorkItemFileRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_item_file").select("file_id, linked_at, file:file_id (id, name, mime_type, updated_at, storage_path, drive_folder_id)").eq("item_id", id).order("linked_at");
  return (data ?? []) as unknown as WorkItemFileRow[];
}

export type AssignablePerson = PersonRef & { global_role: Tables<"profile">["global_role"] };

/**
 * Quem pode receber ações: qualquer conta ativa (ACT-003). Admin e coordenação
 * primeiro; os demais só enxergam o item que receberem (RLS).
 */
export async function listAssignablePeople(): Promise<AssignablePerson[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("id, full_name, email, global_role").eq("status", "active").order("full_name");
  const rank = (p: AssignablePerson) => (p.global_role === "admin" || p.global_role === "coordination" ? 0 : 1);
  return ((data ?? []) as AssignablePerson[]).sort((a, b) => rank(a) - rank(b));
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

/** Rótulo nas listas de escolha: admin/coordenação pelo nome; os demais com o papel. */
export function personOption(p: AssignablePerson, roles: Record<string, string>): { id: string; name: string } {
  const overseer = p.global_role === "admin" || p.global_role === "coordination";
  return { id: p.id, name: overseer ? personName(p) : `${personName(p)} · ${roles[p.global_role] ?? p.global_role}` };
}

export interface QuickCreateData {
  me: string;
  people: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
}

/** Opções do "+ Nova ação": pessoas que podem receber ações e vínculos opcionais. */
export async function quickCreateOptions(me: string, roles: Record<string, string>): Promise<QuickCreateData> {
  const [people, links] = await Promise.all([listAssignablePeople(), listLinkOptions()]);
  return { me, people: people.map((p) => personOption(p, roles)), ...links };
}

/** Nomes de quem participa da ação e quem pode ser mencionado (função do banco; vale também para quem não é da coordenação). */
export async function getParticipants(id: string): Promise<Array<{ id: string; name: string; canMention: boolean }>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("work_item_participants", { p_item: id });
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, canMention: r.can_mention }));
}

export type ChecklistRow = Tables<"work_item_checklist_item">;
export async function listWorkItemChecklist(id: string): Promise<ChecklistRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_item_checklist_item").select("*").eq("item_id", id).order("position").order("created_at");
  return data ?? [];
}

/** Ações ligadas a um projeto ou a uma missão (abertas primeiro, depois as concluídas mais recentes). */
export async function listLinkedWorkItems(filter: { projectId?: string; missionId?: string }): Promise<WorkItemRow[]> {
  if (!filter.missionId && !filter.projectId) return [];
  const supabase = await createClient();
  let q = supabase.from("work_item").select(SELECT);
  q = filter.missionId ? q.eq("mission_id", filter.missionId) : q.eq("project_id", filter.projectId!);
  const { data } = await q.order("completed_at", { ascending: false, nullsFirst: true }).order("due_at", { ascending: true, nullsFirst: false }).limit(100);
  return (data ?? []) as unknown as WorkItemRow[];
}

export interface MentionRow {
  commentId: string;
  itemId: string;
  itemTitle: string;
  author: string;
  body: string;
  at: string;
}

/**
 * Menções para a pessoa nos últimos 14 dias ainda sem resposta: comentar na
 * ação depois da menção tira o aviso da Minha mesa (não há estado de "lido").
 */
export async function listMyMentions(userId: string, now = new Date()): Promise<MentionRow[]> {
  const supabase = await createClient();
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("work_item_comment")
    .select("id, item_id, body, created_at, author:author_id (id, full_name, email), item:item_id (id, title, status)")
    .contains("mentions", [userId])
    .neq("author_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(30);
  type Row = { id: string; item_id: string; body: string; created_at: string; author: PersonRef | null; item: { id: string; title: string; status: string } | null };
  const mentions = ((data ?? []) as unknown as Row[]).filter((m) => m.item && m.item.status !== "cancelled");
  if (mentions.length === 0) return [];
  const { data: mine } = await supabase
    .from("work_item_comment")
    .select("item_id, created_at")
    .eq("author_id", userId)
    .in("item_id", [...new Set(mentions.map((m) => m.item_id))])
    .gte("created_at", since);
  const answered = (m: Row) => (mine ?? []).some((c) => c.item_id === m.item_id && c.created_at > m.created_at);
  return mentions.filter((m) => !answered(m)).map((m) => ({ commentId: m.id, itemId: m.item_id, itemTitle: m.item!.title, author: personName(m.author), body: m.body, at: m.created_at }));
}

/** Ações da semana para o resumo: abertas + criadas ou concluídas desde `since`. */
export async function listWeeklyWorkItems(since: string): Promise<WorkItemRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("work_item")
    .select(SELECT)
    .or(`created_at.gte.${since},completed_at.gte.${since},status.in.(inbox,planned,in_progress,waiting,blocked,awaiting_approval)`)
    .limit(1000);
  return (data ?? []) as unknown as WorkItemRow[];
}

export type ProcessRow = Tables<"work_process"> & {
  owner: PersonRef | null;
  organization: Pick<Tables<"organization">, "id" | "name"> | null;
  project: Pick<Tables<"project">, "slug" | "name"> | null;
  items: Array<{ status: WorkItemRow["status"]; process_phase: string }>;
};
const PROCESS_SELECT = "*, owner:owner_id (id, full_name, email), organization:organization_id (id, name), project:project_id (slug, name), items:work_item (status, process_phase)";

export async function listProcesses(): Promise<ProcessRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("work_process").select(PROCESS_SELECT).order("event_date", { ascending: false }).limit(60);
  return (data ?? []) as unknown as ProcessRow[];
}

export async function getProcess(id: string): Promise<{ process: ProcessRow; items: WorkItemRow[] } | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const [{ data: process }, { data: items }] = await Promise.all([
    supabase.from("work_process").select(PROCESS_SELECT).eq("id", id).maybeSingle(),
    supabase.from("work_item").select(SELECT).eq("process_id", id).order("process_position"),
  ]);
  if (!process) return null;
  return { process: process as unknown as ProcessRow, items: (items ?? []) as unknown as WorkItemRow[] };
}

