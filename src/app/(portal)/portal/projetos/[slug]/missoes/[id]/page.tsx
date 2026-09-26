import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MISSION_STATUS_TONE, missionTargets } from "@/components/portal/projects/MissionCard";
import { AssigneeForms, ChecklistForms, CommentForm, MissionForm } from "@/components/portal/projects/MissionForms";
import { ProjectHeader } from "@/components/portal/projects/ProjectHeader";
import { StatusActions } from "@/components/portal/projects/StatusActions";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { transitionMission } from "@/lib/portal/actions/missions";
import { canManageMission, isMissionLate } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";
import { getMission, listChecklist, listComments } from "@/lib/portal/queries/missions";
import { listActivity, listMembers } from "@/lib/portal/queries/projects";

export const metadata: Metadata = { title: "Missão" };

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/**
 * Detalhe da missão (10): campos, transição, responsáveis (só membros),
 * checklist, comentários e histórico com ator/origem/destino/data.
 * `?editar=1` mostra o formulário de edição (com versão).
 */
export default async function MissionPage({ params, searchParams }: PageProps<"/portal/projetos/[slug]/missoes/[id]">) {
  const { slug, id } = await params;
  const sp = await searchParams;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  const mission = await getMission(id);
  if (!mission || mission.project_id !== project.id) notFound();
  const [checklist, comments, members, activity] = await Promise.all([listChecklist(mission.id), listComments(mission.id), listMembers(project.id), listActivity(project.id, mission.id, 20)]);
  const manage = canManageMission(actor, { createdBy: mission.created_by, assigneeIds: mission.assignees.map((a) => a.profile_id) });
  const editing = sp.editar === "1" && manage;
  const targets = missionTargets(actor, mission, dict);
  const base = `/portal/projetos/${project.slug}/missoes`;
  const m = dict.missions;
  const fmt = (iso: string) => formatDate("pt", new Date(iso), { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="missions" />

      {editing ? (
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-6">
          <h2 className="mb-5 text-lg font-bold">{m.editTitle}</h2>
          <MissionForm dict={dict} projectId={project.id} slug={project.slug} mission={mission} cancelHref={`${base}/${mission.id}`} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-8">
            <section className="rounded-xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={MISSION_STATUS_TONE[mission.status]}>{m.status[mission.status]}</Badge>
                {isMissionLate(mission) && <Badge tone="danger">{m.late}</Badge>}
                <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{m.priorities[mission.priority]}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-2xl font-black">{mission.title}</h2>
                {manage && (
                  <LinkButton href={`${base}/${mission.id}?editar=1`} variant="secondary" size="sm">
                    {dict.common.edit}
                  </LinkButton>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{mission.description || dict.common.none}</p>
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className={H2}>{m.dueAt}</dt>
                  <dd className="mt-1">{mission.due_at ? fmt(mission.due_at) : m.noDue}</dd>
                </div>
                <div>
                  <dt className={H2}>{m.deliverables}</dt>
                  <dd className="mt-1 whitespace-pre-line">{mission.deliverables || dict.common.none}</dd>
                </div>
                {mission.completed_at && (
                  <div>
                    <dt className={H2}>{m.completedAt}</dt>
                    <dd className="mt-1">{fmt(mission.completed_at)}</dd>
                  </div>
                )}
                <div>
                  <dt className={H2}>{dict.projects.updated}</dt>
                  <dd className="mt-1">
                    {fmt(mission.updated_at)} · {dict.projects.version} {mission.version}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-lg font-bold">{m.checklist}</h2>
              <div className="mt-3">
                <ChecklistForms dict={dict} missionId={mission.id} slug={project.slug} items={checklist} canManage={manage} />
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-lg font-bold">{m.comments}</h2>
              {comments.length > 0 && (
                <ol className="mt-3 flex flex-col gap-3">
                  {comments.map((c) => (
                    <li key={c.id} className="rounded-lg border border-line bg-canvas px-4 py-3 text-sm">
                      <p className="text-xs text-fg-muted">
                        <span className="font-bold text-fg">{c.author?.full_name || c.author?.email}</span> · {fmt(c.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{c.body}</p>
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-4">
                <CommentForm dict={dict} missionId={mission.id} slug={project.slug} />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{dict.projects.transition}</h2>
              <p className="mt-1 text-xs text-fg-muted">{m.transitionsHelp}</p>
              {targets.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{dict.common.none}</p>
              ) : (
                <div className="mt-3">
                  <StatusActions action={transitionMission} hidden={{ id: mission.id, slug: project.slug, version: String(mission.version) }} from={mission.status} targets={targets} dict={dict} label={dict.projects.transition} />
                </div>
              )}
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{m.assignees}</h2>
              <div className="mt-3">
                <AssigneeForms
                  dict={dict}
                  missionId={mission.id}
                  slug={project.slug}
                  candidates={members.filter((x) => x.role !== "viewer").map((x) => ({ id: x.profile_id, name: x.profile?.full_name || x.profile?.email || x.profile_id }))}
                  assigned={mission.assignees.map((a) => ({ id: a.profile_id, name: a.profile?.full_name || a.profile?.email || a.profile_id }))}
                  canManage={manage}
                />
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{m.history}</h2>
              {activity.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{m.noHistory}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {activity.map((e) => (
                    <li key={e.id} className="border-l-2 border-line pl-3">
                      <p>
                        <span className="font-bold">{e.actor?.full_name || e.actor?.email || dict.common.none}</span> {m.events[e.kind as keyof typeof m.events] ?? e.kind}
                        {e.kind === "mission.status" && e.to_value && (
                          <>
                            {" "}
                            {e.from_value ? m.status[e.from_value as keyof typeof m.status] : ""} → <span className="font-bold">{m.status[e.to_value as keyof typeof m.status]}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-fg-muted">{fmt(e.occurred_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <div>
              <LinkButton href={base} variant="secondary">
                ← {m.back}
              </LinkButton>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
