import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ProjectRole, ProjectStatus } from "@/lib/portal/authz";

/**
 * Leitura de projetos/equipe no servidor. Toda consulta corre sob a RLS do
 * usuário da sessão: nada aqui amplia acesso. Paginação e filtros são estado
 * de URL (08: sem JS obrigatório).
 */
export type ProjectRow = Tables<"project">;
export type MembershipRow = Tables<"project_membership"> & { profile: Pick<Tables<"profile">, "id" | "full_name" | "email" | "status" | "global_role"> | null };

export const PAGE_SIZE = 12;

export interface ProjectListFilter {
  status?: ProjectStatus | "all";
  q?: string;
  page?: number;
}

export async function listProjects(filter: ProjectListFilter): Promise<{ items: ProjectRow[]; total: number; page: number; pages: number }> {
  const supabase = await createClient();
  const page = Math.max(1, filter.page ?? 1);
  let query = supabase.from("project").select("*", { count: "exact" }).order("updated_at", { ascending: false });
  // Arquivados/cancelados ficam fora do padrão (10): só entram quando pedidos.
  if (!filter.status || filter.status === "all") query = query.not("status", "in", "(archived,cancelled)");
  else query = query.eq("status", filter.status);
  if (filter.q) query = query.ilike("name", `%${filter.q.replace(/[%_]/g, "")}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const total = count ?? 0;
  return { items: data ?? [], total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("project").select("*").eq("slug", slug).maybeSingle();
  return data;
});

/** Papel vigente do usuário no projeto (RLS: só a própria linha ou as do projeto que ele já vê). */
export const getMyProjectRole = cache(async (projectId: string, userId: string): Promise<ProjectRole | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_membership")
    .select("role, status, expires_at")
    .eq("project_id", projectId)
    .eq("profile_id", userId)
    .maybeSingle();
  if (!data || data.status !== "active") return null;
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return null;
  return data.role;
});

export async function listMembers(projectId: string): Promise<MembershipRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_membership")
    .select("*, profile:profile_id (id, full_name, email, status, global_role)")
    .eq("project_id", projectId)
    .eq("status", "active")
    .order("role")
    .order("created_at");
  return (data ?? []) as unknown as MembershipRow[];
}

export interface ActivityRow {
  id: number;
  kind: string;
  from_value: string | null;
  to_value: string | null;
  occurred_at: string;
  actor: { full_name: string; email: string } | null;
  mission_id: string | null;
}

export async function listActivity(projectId: string, missionId?: string, limit = 30): Promise<ActivityRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("activity_event")
    .select("id, kind, from_value, to_value, occurred_at, mission_id, actor:actor_id (full_name, email)")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (missionId) q = q.eq("mission_id", missionId);
  const { data } = await q;
  return (data ?? []) as unknown as ActivityRow[];
}
