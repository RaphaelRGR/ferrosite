import type { Metadata } from "next";
import Link from "next/link";
import { MissionCard } from "@/components/portal/projects/MissionCard";
import { ProjectHeader } from "@/components/portal/projects/ProjectHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, institutionalDate } from "@/i18n/format";
import { canCreateMission, MISSION_STATUSES, type MissionStatus } from "@/lib/portal/authz";
import { loadProject } from "@/lib/portal/context";
import { listMissions, type MissionWithAssignees } from "@/lib/portal/queries/missions";

export const metadata: Metadata = { title: "Missões" };

const VIEWS = ["lista", "kanban", "calendario"] as const;
type View = (typeof VIEWS)[number];
const KANBAN_COLUMNS: MissionStatus[] = ["planned", "in_progress", "in_validation", "done"];

/** Início da semana (segunda) em America/Sao_Paulo, como chave "YYYY-MM-DD". */
function weekKey(iso: string): string {
  const local = new Date(`${institutionalDate(new Date(iso))}T00:00:00Z`);
  const day = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - day);
  return local.toISOString().slice(0, 10);
}

/**
 * Missões do projeto: lista, Kanban e calendário são três visões da mesma
 * consulta (10); visão e filtro são estado de URL; transição por botões em
 * qualquer visão (drag nunca é o único mecanismo). Mobile: uma coluna (08).
 */
export default async function ProjectMissionsPage({ params, searchParams }: PageProps<"/portal/projetos/[slug]/missoes">) {
  const { slug } = await params;
  const sp = await searchParams;
  const dict = getDictionary("pt").portal;
  const { project, actor } = await loadProject(slug);
  const view: View = VIEWS.includes(sp.vista as View) ? (sp.vista as View) : "lista";
  const statusParam = String(sp.situacao ?? "open");
  const status = statusParam === "all" ? "all" : (MISSION_STATUSES as string[]).includes(statusParam) ? (statusParam as MissionStatus) : "open";
  const missions = await listMissions(project.id, { status: view === "kanban" ? "all" : status });
  const base = `/portal/projetos/${project.slug}/missoes`;
  const link = (v: View, s = status) => `${base}?vista=${v}${s !== "open" ? `&situacao=${s}` : ""}`;
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"}`;

  const byWeek = new Map<string, MissionWithAssignees[]>();
  const undated: MissionWithAssignees[] = [];
  if (view === "calendario") {
    for (const m of missions) {
      if (!m.due_at) undated.push(m);
      else byWeek.set(weekKey(m.due_at), [...(byWeek.get(weekKey(m.due_at)) ?? []), m]);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader project={project} actor={actor} dict={dict} tab="missions" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label={dict.missions.view} className="flex flex-wrap gap-2">
          {VIEWS.map((v) => (
            <Link key={v} href={link(v)} aria-current={view === v ? "page" : undefined} className={chip(view === v)}>
              {v === "lista" ? dict.missions.list : v === "kanban" ? dict.missions.kanban : dict.missions.calendar}
            </Link>
          ))}
        </nav>
        {canCreateMission(actor) && <LinkButton href={`${base}/nova`}>{dict.missions.new}</LinkButton>}
      </div>

      {view !== "kanban" && (
        <nav aria-label={dict.missions.filterStatus} className="flex flex-wrap gap-2">
          <Link href={link(view, "open")} aria-current={status === "open" ? "page" : undefined} className={chip(status === "open")}>
            {dict.missions.open}
          </Link>
          <Link href={link(view, "all")} aria-current={status === "all" ? "page" : undefined} className={chip(status === "all")}>
            {dict.missions.all}
          </Link>
          {MISSION_STATUSES.map((s) => (
            <Link key={s} href={link(view, s)} aria-current={status === s ? "page" : undefined} className={chip(status === s)}>
              {dict.missions.status[s]}
            </Link>
          ))}
        </nav>
      )}

      {missions.length === 0 ? (
        <EmptyState title={status === "open" && view !== "kanban" ? dict.missions.emptyProject : dict.missions.empty} description={dict.missions.transitionsHelp} />
      ) : view === "lista" ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {missions.map((m) => (
            <li key={m.id}>
              <MissionCard mission={m} slug={project.slug} actor={actor} dict={dict} />
            </li>
          ))}
        </ul>
      ) : view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => {
            const items = missions.filter((m) => m.status === col || (col === "planned" && m.status === "paused"));
            return (
              <section key={col} aria-labelledby={`col-${col}`} className="flex flex-col gap-3 rounded-xl border border-line bg-canvas p-3">
                <h2 id={`col-${col}`} className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                  {dict.missions.status[col]}
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px]">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="text-xs text-fg-muted">{dict.common.none}</p>
                ) : (
                  items.map((m) => <MissionCard key={m.id} mission={m} slug={project.slug} actor={actor} dict={dict} />)
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-fg-muted">{dict.missions.calendarHelp}</p>
          {[...byWeek.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, items]) => (
              <section key={week} aria-labelledby={`w-${week}`} className="flex flex-col gap-3">
                <h2 id={`w-${week}`} className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                  {formatDate("pt", new Date(`${week}T12:00:00-03:00`), { day: "2-digit", month: "long", year: "numeric" })}
                </h2>
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((m) => (
                    <li key={m.id}>
                      <MissionCard mission={m} slug={project.slug} actor={actor} dict={dict} compact />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          {undated.length > 0 && (
            <section aria-labelledby="w-undated" className="flex flex-col gap-3">
              <h2 id="w-undated" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                {dict.missions.undated}
              </h2>
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {undated.map((m) => (
                  <li key={m.id}>
                    <MissionCard mission={m} slug={project.slug} actor={actor} dict={dict} compact />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
