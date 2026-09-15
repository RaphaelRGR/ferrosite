import type { Metadata } from "next";
import Link from "next/link";
import { ProjectHeader } from "@/components/portal/ProjectHeader";
import { StatusActions, type StatusTarget } from "@/components/portal/StatusActions";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { transitionProject } from "@/lib/portal/actions/projects";
import { canManageProject, canTransitionProject, isMissionLate, PROJECT_TRANSITIONS } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";
import { listMissions } from "@/lib/portal/missions";
import { listActivity } from "@/lib/portal/projects";

export async function generateMetadata({ params }: PageProps<"/portal/projetos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/** Visão geral do projeto: campos, situação com transições permitidas, missões abertas e histórico (10). */
export default async function ProjectOverviewPage({ params }: PageProps<"/portal/projetos/[slug]">) {
  const { slug } = await params;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  const [missions, activity] = await Promise.all([listMissions(project.id, { status: "open" }), listActivity(project.id, undefined, 15)]);
  const targets: StatusTarget[] = PROJECT_TRANSITIONS[project.status]
    .filter((to) => canTransitionProject(actor, project.status, to))
    .map((to) => ({ to, label: dict.projects.transitionTo.replace("{status}", dict.projectStatus[to]), variant: to === "cancelled" ? "danger" : to === "active" ? "primary" : "secondary" }));
  const manage = canManageProject(actor);
  const fmt = (iso: string | null, style: "short" | "medium" = "medium") => (iso ? formatDate("pt", new Date(iso), { dateStyle: style }) : dict.common.none);

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="overview" />

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold">{dict.projects.overview}</h2>
              {manage && (
                <LinkButton href={`/portal/projetos/${project.slug}/editar`} variant="secondary" size="sm">
                  {dict.common.edit}
                </LinkButton>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm">{project.summary || dict.common.none}</p>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className={H2}>{dict.projects.category}</dt>
                <dd className="mt-1">{dict.projectCategory[project.category as keyof typeof dict.projectCategory]}</dd>
              </div>
              <div>
                <dt className={H2}>{dict.projects.classification}</dt>
                <dd className="mt-1">{dict.classification[project.classification]}</dd>
              </div>
              <div>
                <dt className={H2}>{dict.projects.period}</dt>
                <dd className="mt-1">
                  {fmt(project.starts_on)} — {fmt(project.ends_on)}
                </dd>
              </div>
              <div>
                <dt className={H2}>{dict.projects.updated}</dt>
                <dd className="mt-1">
                  {fmt(project.updated_at)} · {dict.projects.version} {project.version}
                </dd>
              </div>
            </dl>
            {project.status === "archived" && <p className="mt-4 rounded-lg border border-line bg-canvas px-4 py-3 text-sm text-fg-muted">{dict.projects.archivedNotice}</p>}
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{dict.projects.lastMissions}</h2>
              <LinkButton href={`/portal/projetos/${project.slug}/missoes`} variant="secondary" size="sm">
                {dict.projects.missions}
              </LinkButton>
            </div>
            {missions.length === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{dict.missions.emptyProject}</p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-line">
                {missions.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/portal/projetos/${project.slug}/missoes/${m.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {m.title}
                    </Link>
                    <span className="flex items-center gap-2">
                      {isMissionLate(m) && <Badge tone="danger">{dict.missions.late}</Badge>}
                      <Badge tone="neutral">{dict.missions.status[m.status]}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{dict.projects.transition}</h2>
            {targets.length === 0 ? (
              <p className="mt-2 text-sm text-fg-muted">{dict.common.none}</p>
            ) : (
              <div className="mt-3">
                <StatusActions action={transitionProject} hidden={{ id: project.id, version: String(project.version) }} from={project.status} targets={targets} dict={dict} label={dict.projects.transition} />
              </div>
            )}
          </section>
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{dict.projects.activity}</h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-fg-muted">{dict.projects.noActivity}</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2 text-sm">
                {activity.map((e) => (
                  <li key={e.id} className="border-l-2 border-line pl-3">
                    <p>
                      <span className="font-bold">{e.actor?.full_name || e.actor?.email || dict.common.none}</span> {dict.missions.events[e.kind as keyof typeof dict.missions.events] ?? e.kind}
                      {e.kind.endsWith(".status") && e.to_value && (
                        <>
                          {" "}
                          → <span className="font-bold">{e.kind === "project.status" ? dict.projectStatus[e.to_value as keyof typeof dict.projectStatus] : dict.missions.status[e.to_value as keyof typeof dict.missions.status]}</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-fg-muted">{formatDate("pt", new Date(e.occurred_at), { dateStyle: "short", timeStyle: "short" })}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
