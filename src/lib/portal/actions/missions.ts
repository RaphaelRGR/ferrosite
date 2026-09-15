"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, type ActionState } from "../action-state";
import { canCreateMission, canManageMission, canTransitionMission, MISSION_STATUSES, type Actor, type MissionStatus } from "../authz";
import { getMission } from "../missions";
import { getMyProjectRole } from "../projects";

/**
 * Server Actions de missão (PORTAL-003): criação, edição com versão,
 * transição de status (mesma action para lista/Kanban/calendário — 10),
 * responsáveis, checklist e comentários. Decisão final no banco.
 */
async function actor(projectId: string): Promise<{ actor: Actor; userId: string } | ActionState> {
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return { error: "unauthenticated" };
  const projectRole = await getMyProjectRole(projectId, session.user.id);
  return { actor: { id: session.user.id, globalRole: session.profile.global_role, projectRole }, userId: session.user.id };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);
const PRIORITIES = ["low", "medium", "high"] as const;

function missionPaths(slug: string, missionId?: string) {
  revalidatePath(`/portal/projetos/${slug}/missoes`);
  if (missionId) revalidatePath(`/portal/projetos/${slug}/missoes/${missionId}`);
}

function readMissionFields(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const title = str(fd, "title", 200);
  if (title.length < 2) return { error: "invalid", field: "title" };
  const priority = str(fd, "priority") as (typeof PRIORITIES)[number];
  if (!PRIORITIES.includes(priority)) return { error: "invalid", field: "priority" };
  const due = str(fd, "due_at", 16);
  // datetime-local no fuso do curso (America/Sao_Paulo, -03:00) — 24: prazo/timezone explícitos.
  const due_at = due ? (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(due) ? `${due}:00-03:00` : null) : null;
  if (due && !due_at) return { error: "invalid", field: "due_at" };
  return { fields: { title, description: str(fd, "description", 4000), deliverables: str(fd, "deliverables", 2000), priority, due_at } };
}

export async function createMission(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = str(fd, "project_id");
  const slug = str(fd, "slug");
  if (!projectId || !slug) return { error: "invalid" };
  const a = await actor(projectId);
  if (isState(a)) return a;
  if (!canCreateMission(a.actor)) return { error: "forbidden" };
  const parsed = readMissionFields(fd);
  if (isState(parsed)) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mission")
    .insert({ ...parsed.fields, project_id: projectId, created_by: a.userId, updated_by: a.userId } as never)
    .select("id")
    .single();
  if (error) return { error: dbError(error) };
  missionPaths(slug);
  redirect(`/portal/projetos/${slug}/missoes/${data.id}`);
}

export async function updateMission(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return { error: "invalid" };
  const mission = await getMission(id);
  if (!mission) return { error: "not_found" };
  const a = await actor(mission.project_id);
  if (isState(a)) return a;
  if (!canManageMission(a.actor, { createdBy: mission.created_by, assigneeIds: mission.assignees.map((x) => x.profile_id) })) return { error: "forbidden" };
  const parsed = readMissionFields(fd);
  if (isState(parsed)) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mission")
    .update({ ...parsed.fields, updated_by: a.userId } as never)
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "conflict" };
  missionPaths(slug, id);
  return { ok: true };
}

export async function transitionMission(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const version = Number(fd.get("version"));
  const from = str(fd, "from") as MissionStatus;
  const to = str(fd, "to") as MissionStatus;
  if (!id || !Number.isInteger(version) || !MISSION_STATUSES.includes(from) || !MISSION_STATUSES.includes(to)) return { error: "invalid" };
  const mission = await getMission(id);
  if (!mission) return { error: "not_found" };
  const a = await actor(mission.project_id);
  if (isState(a)) return a;
  const m = { createdBy: mission.created_by, assigneeIds: mission.assignees.map((x) => x.profile_id) };
  if (!canTransitionMission(a.actor, m, from, to)) return { error: "forbidden" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mission")
    .update({ status: to, updated_by: a.userId })
    .eq("id", id)
    .eq("version", version)
    .eq("status", from)
    .select("id");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "conflict" };
  missionPaths(slug, id);
  return { ok: true };
}

export async function setAssignee(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const profileId = str(fd, "profile_id");
  const op = str(fd, "op");
  if (!id || !profileId || !["add", "remove"].includes(op)) return { error: "invalid" };
  const mission = await getMission(id);
  if (!mission) return { error: "not_found" };
  const a = await actor(mission.project_id);
  if (isState(a)) return a;
  if (!canManageMission(a.actor, { createdBy: mission.created_by, assigneeIds: mission.assignees.map((x) => x.profile_id) })) return { error: "forbidden" };

  const supabase = await createClient();
  const { error } =
    op === "add"
      ? await supabase.from("mission_assignee").insert({ mission_id: id, profile_id: profileId })
      : await supabase.from("mission_assignee").delete().eq("mission_id", id).eq("profile_id", profileId);
  if (error) return { error: dbError(error) };
  missionPaths(slug, id);
  return { ok: true };
}

export async function addChecklistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const label = str(fd, "label", 300);
  if (!id || !label) return { error: "invalid", field: "label" };
  const mission = await getMission(id);
  if (!mission) return { error: "not_found" };
  const a = await actor(mission.project_id);
  if (isState(a)) return a;
  const supabase = await createClient();
  const { error } = await supabase.from("mission_checklist_item").insert({ mission_id: id, label, created_by: a.userId, position: Number(fd.get("position") ?? 0) || 0 });
  if (error) return { error: dbError(error) };
  missionPaths(slug, id);
  return { ok: true };
}

export async function toggleChecklistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const itemId = str(fd, "item_id");
  const done = str(fd, "done") === "true";
  if (!id || !itemId) return { error: "invalid" };
  const supabase = await createClient();
  const { error, data } = await supabase.from("mission_checklist_item").update({ done }).eq("id", itemId).eq("mission_id", id).select("id");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "forbidden" };
  missionPaths(slug, id);
  return { ok: true };
}

export async function removeChecklistItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const itemId = str(fd, "item_id");
  if (!id || !itemId) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("mission_checklist_item").delete().eq("id", itemId).eq("mission_id", id);
  if (error) return { error: dbError(error) };
  missionPaths(slug, id);
  return { ok: true };
}

export async function addComment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const slug = str(fd, "slug");
  const body = str(fd, "body", 4000);
  if (!id || !body) return { error: "invalid", field: "body" };
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return { error: "unauthenticated" };
  const supabase = await createClient();
  const { error } = await supabase.from("mission_comment").insert({ mission_id: id, author_id: session.user.id, body });
  if (error) return { error: dbError(error) };
  missionPaths(slug, id);
  return { ok: true };
}
