import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { MissionStatus } from "@/lib/portal/authz";

/** Leitura de missões no servidor (RLS do usuário). Lista/Kanban/calendário são visões da mesma consulta (10). */
export type MissionRow = Tables<"mission">;
export type AssigneeRow = { profile_id: string; profile: Pick<Tables<"profile">, "full_name" | "email"> | null };
export type MissionWithAssignees = MissionRow & { assignees: AssigneeRow[] };
export type ChecklistRow = Tables<"mission_checklist_item">;
export type CommentRow = Tables<"mission_comment"> & { author: Pick<Tables<"profile">, "full_name" | "email"> | null };

export interface MissionFilter {
  status?: MissionStatus | "all" | "open";
  assignee?: string;
}

export async function listMissions(projectId: string, filter: MissionFilter = {}): Promise<MissionWithAssignees[]> {
  const supabase = await createClient();
  let q = supabase
    .from("mission")
    .select("*, assignees:mission_assignee (profile_id, profile:profile_id (full_name, email))")
    .eq("project_id", projectId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (filter.status && filter.status !== "all" && filter.status !== "open") q = q.eq("status", filter.status);
  if (filter.status === "open" || !filter.status) q = q.not("status", "in", "(done,cancelled)");
  const { data } = await q;
  const items = (data ?? []) as unknown as MissionWithAssignees[];
  return filter.assignee ? items.filter((m) => m.assignees.some((a) => a.profile_id === filter.assignee)) : items;
}

export const getMission = cache(async (id: string): Promise<MissionWithAssignees | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission")
    .select("*, assignees:mission_assignee (profile_id, profile:profile_id (full_name, email))")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as MissionWithAssignees | null) ?? null;
});

export async function listChecklist(missionId: string): Promise<ChecklistRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("mission_checklist_item").select("*").eq("mission_id", missionId).order("position").order("created_at");
  return data ?? [];
}

export async function listComments(missionId: string): Promise<CommentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_comment")
    .select("*, author:author_id (full_name, email)")
    .eq("mission_id", missionId)
    .order("created_at");
  return (data ?? []) as unknown as CommentRow[];
}
