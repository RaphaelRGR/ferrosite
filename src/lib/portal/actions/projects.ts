"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, type ActionState } from "../action-state";
import { canCreateProject, canManageProject, canTransitionProject, CLASSIFICATIONS, PROJECT_CATEGORIES, PROJECT_STATUSES, SLUG_RE, slugify, type Actor, type Classification, type ProjectCategory, type ProjectStatus } from "../authz";
import { getMyProjectRole } from "../projects";

/**
 * Server Actions de projeto/equipe (PORTAL-002). Validação cedo (papel,
 * formato) + decisão final no banco (RLS/triggers). Concorrência por versão:
 * UPDATE só aplica se `version` for a que o formulário viu (10).
 */
async function actor(projectId?: string): Promise<{ actor: Actor; userId: string } | ActionState> {
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return { error: "unauthenticated" };
  const projectRole = projectId ? await getMyProjectRole(projectId, session.user.id) : null;
  return { actor: { id: session.user.id, globalRole: session.profile.global_role, projectRole }, userId: session.user.id };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;

const str = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);
const dateOrNull = (v: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function readProjectFields(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const name = str(fd, "name", 160);
  if (name.length < 2) return { error: "invalid", field: "name" };
  const category = str(fd, "category") as ProjectCategory;
  if (!PROJECT_CATEGORIES.includes(category)) return { error: "invalid", field: "category" };
  const classification = str(fd, "classification") as Classification;
  if (!CLASSIFICATIONS.includes(classification)) return { error: "invalid", field: "classification" };
  const starts_on = dateOrNull(str(fd, "starts_on"));
  const ends_on = dateOrNull(str(fd, "ends_on"));
  if (starts_on && ends_on && ends_on < starts_on) return { error: "invalid", field: "ends_on" };
  return {
    fields: {
      name,
      name_en: str(fd, "name_en", 160),
      summary: str(fd, "summary", 2000),
      summary_en: str(fd, "summary_en", 2000),
      category,
      classification,
      starts_on,
      ends_on,
    },
  };
}

export async function createProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return a;
  if (!canCreateProject(a.actor.globalRole)) return { error: "forbidden" };
  const parsed = readProjectFields(fd);
  if (isState(parsed)) return parsed;
  const slug = slugify(str(fd, "slug", 80) || String(parsed.fields.name));
  if (!SLUG_RE.test(slug)) return { error: "invalid", field: "slug" };

  const supabase = await createClient();
  const { error } = await supabase.from("project").insert({ ...parsed.fields, slug, created_by: a.userId, updated_by: a.userId, status: "draft" } as never);
  if (error) return { error: dbError(error) };
  revalidatePath("/portal/projetos");
  redirect(`/portal/projetos/${slug}`);
}

export async function updateProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return { error: "invalid" };
  const a = await actor(id);
  if (isState(a)) return a;
  if (!canManageProject(a.actor)) return { error: "forbidden" };
  const parsed = readProjectFields(fd);
  if (isState(parsed)) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project")
    .update({ ...parsed.fields, updated_by: a.userId } as never)
    .eq("id", id)
    .eq("version", version)
    .select("slug");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "conflict" };
  revalidatePath(`/portal/projetos/${data[0].slug}`);
  return { ok: true };
}

export async function transitionProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  const from = str(fd, "from") as ProjectStatus;
  const to = str(fd, "to") as ProjectStatus;
  if (!id || !Number.isInteger(version) || !PROJECT_STATUSES.includes(from) || !PROJECT_STATUSES.includes(to)) return { error: "invalid" };
  const a = await actor(id);
  if (isState(a)) return a;
  if (!canTransitionProject(a.actor, from, to)) return { error: "forbidden" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project")
    .update({ status: to, updated_by: a.userId })
    .eq("id", id)
    .eq("version", version)
    .eq("status", from)
    .select("slug");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "conflict" };
  revalidatePath("/portal/projetos");
  revalidatePath(`/portal/projetos/${data[0].slug}`);
  return { ok: true };
}

const PROJECT_ROLES = ["leader", "member", "viewer", "external"] as const;

export async function addMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = str(fd, "project_id");
  const slug = str(fd, "slug");
  const email = str(fd, "email", 254).toLowerCase();
  const role = str(fd, "role") as (typeof PROJECT_ROLES)[number];
  const expires = dateOrNull(str(fd, "expires_at"));
  if (!projectId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "invalid", field: "email" };
  if (!PROJECT_ROLES.includes(role)) return { error: "invalid", field: "role" };
  // 11: externo expira por padrão — sem prazo, não entra.
  if (role === "external" && !expires) return { error: "invalid", field: "expires_at" };
  const a = await actor(projectId);
  if (isState(a)) return a;
  if (!canManageProject(a.actor)) return { error: "forbidden" };

  const supabase = await createClient();
  const found = await supabase.rpc("find_profile_by_email", { p_email: email });
  if (found.error) return { error: dbError(found.error) };
  const profile = found.data?.[0];
  if (!profile) return { error: "not_found", field: "email" };
  const { error } = await supabase.from("project_membership").upsert(
    { project_id: projectId, profile_id: profile.id, role, status: "active", expires_at: expires ? `${expires}T23:59:59-03:00` : null, granted_by: a.userId },
    { onConflict: "project_id,profile_id" },
  );
  if (error) return { error: dbError(error) };
  revalidatePath(`/portal/projetos/${slug}/equipe`);
  return { ok: true };
}

export async function updateMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = str(fd, "project_id");
  const slug = str(fd, "slug");
  const profileId = str(fd, "profile_id");
  const role = str(fd, "role") as (typeof PROJECT_ROLES)[number];
  const expires = dateOrNull(str(fd, "expires_at"));
  if (!projectId || !profileId || !PROJECT_ROLES.includes(role)) return { error: "invalid" };
  if (role === "external" && !expires) return { error: "invalid", field: "expires_at" };
  const a = await actor(projectId);
  if (isState(a)) return a;
  if (!canManageProject(a.actor)) return { error: "forbidden" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_membership")
    .update({ role, expires_at: expires ? `${expires}T23:59:59-03:00` : null })
    .eq("project_id", projectId)
    .eq("profile_id", profileId);
  if (error) return { error: dbError(error) };
  revalidatePath(`/portal/projetos/${slug}/equipe`);
  return { ok: true };
}

export async function removeMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = str(fd, "project_id");
  const slug = str(fd, "slug");
  const profileId = str(fd, "profile_id");
  if (!projectId || !profileId) return { error: "invalid" };
  const a = await actor(projectId);
  if (isState(a)) return a;
  if (!canManageProject(a.actor)) return { error: "forbidden" };

  const supabase = await createClient();
  // Soft-remove (memória): o trigger barra se houver missão aberta atribuída.
  const { error } = await supabase.from("project_membership").update({ status: "removed" }).eq("project_id", projectId).eq("profile_id", profileId);
  if (error) return { error: dbError(error) };
  revalidatePath(`/portal/projetos/${slug}/equipe`);
  return { ok: true };
}
