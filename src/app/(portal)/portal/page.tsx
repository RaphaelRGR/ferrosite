import type { Metadata } from "next";
import Link from "next/link";
import { MISSION_STATUS_TONE } from "@/components/portal/projects/MissionCard";
import { Desk } from "@/components/portal/work-items/Desk";
import { WorkItemList } from "@/components/portal/work-items/WorkItemCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isMissionLate, isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listOpenWorkItems } from "@/lib/portal/queries/work-items";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Início" };

/**
 * Início do Portal. Administração e coordenação veem a Minha Mesa (ACT-001:
 * o trabalho primeiro). Os demais veem suas missões, projetos e, se houver,
 * as ações que a administração/coordenação atribuiu a eles. Vazio é vazio.
 */
export default async function PortalDashboardPage() {
  const dict = getDictionary("pt").portal;
  const { profile, userId } = await requireActiveProfile();
  const supabase = await createClient();
  const overseer = isOverseer(profile.global_role);
  const [missions, projects, workItems] = await Promise.all([
    supabase
      .from("mission_assignee")
      .select("mission:mission_id (id, title, status, due_at, project:project_id (slug, name))")
      .eq("profile_id", userId),
    overseer ? Promise.resolve({ data: [] as Array<{ id: string; slug: string; name: string; status: keyof typeof dict.projectStatus }> }) : supabase.from("project").select("id, slug, name, status").not("status", "in", "(archived,cancelled)").order("updated_at", { ascending: false }).limit(6),
    listOpenWorkItems(),
  ]);
  type Row = { mission: { id: string; title: string; status: "planned" | "in_progress" | "in_validation" | "done" | "paused" | "cancelled"; due_at: string | null; project: { slug: string; name: string } | null } | null };
  const myMissions = ((missions.data ?? []) as unknown as Row[]).map((r) => r.mission).filter((m): m is NonNullable<Row["mission"]> => !!m && m.status !== "done" && m.status !== "cancelled");
  const name = profile.full_name || profile.email;

  if (overseer) return <Desk dict={dict} items={workItems} userId={userId} name={profile.full_name || ""} missions={myMissions} />;

  const late = myMissions.filter((m) => isMissionLate(m)).length;
  const myProjects = projects.data ?? [];
  const withMe = workItems.filter((i) => i.owner_id === userId || i.approver_id === userId);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{dict.dashboard.title}</p>
        <h1 className="mt-1 text-3xl font-black">
          {dict.dashboard.greeting}
          {name ? `, ${name}` : ""}
        </h1>
      </header>

      {withMe.length > 0 && (
        <div className="flex flex-col gap-2">
          <WorkItemList id="acoes-com-voce" title={dict.workItems.assignedToYou} items={withMe} dict={dict} />
          <p className="text-xs text-fg-muted">{dict.workItems.assignedToYouHint}</p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{dict.dashboard.myMissions}</h2>
            {late > 0 && <Badge tone="danger">{dict.dashboard.lateCount.replace("{count}", String(late))}</Badge>}
          </div>
          {myMissions.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">{dict.dashboard.noMissions}</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line text-sm">
              {myMissions.slice(0, 8).map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <Link href={`/portal/projetos/${m.project?.slug}/missoes/${m.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {m.title}
                    </Link>
                    <span className="block text-xs text-fg-muted">
                      {m.project?.name}
                      {m.due_at && ` · ${formatDate("pt", new Date(m.due_at), { dateStyle: "short" })}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {isMissionLate(m) && <Badge tone="danger">{dict.missions.late}</Badge>}
                    <Badge tone={MISSION_STATUS_TONE[m.status]}>{dict.missions.status[m.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{dict.dashboard.myProjects}</h2>
            <LinkButton href="/portal/projetos" variant="secondary" size="sm">
              {dict.dashboard.seeAll}
            </LinkButton>
          </div>
          {myProjects.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={dict.dashboard.emptyTitle} description={dict.dashboard.emptyDescription} />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line text-sm">
              {myProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/portal/projetos/${p.slug}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    {p.name}
                  </Link>
                  <Badge tone="neutral">{dict.projectStatus[p.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
