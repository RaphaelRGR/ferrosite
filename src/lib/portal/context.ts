import { notFound, redirect } from "next/navigation";
import { getCurrentSession, type CurrentProfile } from "@/lib/auth/session";
import { type Actor } from "./authz";
import { getMyProjectRole, getProjectBySlug, type ProjectRow } from "./projects";

/** Sessão ativa obrigatória nas páginas do Portal (o layout já bloqueia; aqui é defesa em profundidade). */
export async function requireActiveProfile(): Promise<{ userId: string; profile: CurrentProfile }> {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/portal");
  if (!session.profile || session.profile.status !== "active") redirect("/portal");
  return { userId: session.user.id, profile: session.profile };
}

/** Projeto pelo slug sob RLS: inexistente e sem acesso são indistinguíveis (404). */
export async function loadProject(slug: string): Promise<{ project: ProjectRow; actor: Actor; profile: CurrentProfile }> {
  const { userId, profile } = await requireActiveProfile();
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const projectRole = await getMyProjectRole(project.id, userId);
  return { project, profile, actor: { id: userId, globalRole: profile.global_role, projectRole } };
}
