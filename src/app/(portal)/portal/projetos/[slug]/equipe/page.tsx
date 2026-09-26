import type { Metadata } from "next";
import { ProjectHeader } from "@/components/portal/projects/ProjectHeader";
import { AddMemberForm, MemberRowForms } from "@/components/portal/projects/TeamForms";
import { Badge } from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { canManageProject } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";
import { listMembers } from "@/lib/portal/queries/projects";

/** Grant vencido (11): prazo passado. Fora do render para não chamar Date.now() no JSX. */
function isExpired(expiresAt: string | null, now = new Date()): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() <= now.getTime();
}

export const metadata: Metadata = { title: "Equipe" };

/**
 * Equipe do projeto (11): membros vigentes com papel e prazo; líder/overseer
 * adiciona por e-mail cadastrado (busca com escopo e auditada), altera papel/
 * prazo e remove (soft; barrado se houver missão aberta atribuída).
 */
export default async function ProjectTeamPage({ params }: PageProps<"/portal/projetos/[slug]/equipe">) {
  const { slug } = await params;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  const members = await listMembers(project.id);
  const manage = canManageProject(actor);

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="team" />

      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">{dict.projects.members}</h2>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-fg-muted">{dict.projects.noMembers}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {members.map((m) => {
              const expired = isExpired(m.expires_at);
              return (
                <li key={m.profile_id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {m.profile?.full_name || m.profile?.email || m.profile_id}
                      {m.profile_id === actor.id && <span className="ml-2 text-xs font-normal text-fg-muted">({dict.people.you})</span>}
                    </p>
                    <p className="truncate text-sm text-fg-muted">{m.profile?.email}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                      <Badge tone={m.role === "leader" ? "info" : "neutral"}>{dict.projectRoles[m.role]}</Badge>
                      {m.profile?.status && m.profile.status !== "active" && <Badge tone="warning">{dict.accountStatus[m.profile.status]}</Badge>}
                      {m.expires_at && <Badge tone={expired ? "danger" : "neutral"}>{dict.projects.expires} {formatDate("pt", new Date(m.expires_at), { dateStyle: "short" })}</Badge>}
                      <span>
                        {dict.projects.granted} {formatDate("pt", new Date(m.created_at), { dateStyle: "short" })}
                      </span>
                    </p>
                  </div>
                  {manage && <MemberRowForms dict={dict} projectId={project.id} slug={project.slug} profileId={m.profile_id} role={m.role} expiresAt={m.expires_at} isSelf={m.profile_id === actor.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {manage && <AddMemberForm dict={dict} projectId={project.id} slug={project.slug} />}
    </div>
  );
}
