import { ACTIVE_PARTNER_STAGES, type CoordinationInput } from "@/lib/portal/coordination";
import { createClient } from "@/lib/supabase/server";

export interface AgendaItem {
  id: string;
  title: string;
  type: string;
  locale: string;
  status: string;
  event_at: string;
  event_place: string;
}

export interface CoordinationOverview {
  input: CoordinationInput;
  agenda: AgendaItem[];
  counts: { activeProjects: number; overdueMissions: number; contentInReview: number; challengesReceived: number; activePartners: number; activePeople: number | null };
}

const AGENDA_DAYS = 60;

/** Mais recente entre datas ISO (ignora vazias). */
function latest(...dates: Array<string | null | undefined>): string {
  return dates.filter((d): d is string => !!d).reduce((a, b) => (new Date(b) > new Date(a) ? b : a));
}

/**
 * Leituras da Central da coordenação com o cliente de sessão: só faz sentido
 * para admin/coordenação, que a RLS já deixa ver tudo. As regras que decidem
 * o que vira alerta estão em `lib/portal/coordination.ts`.
 */
export async function loadCoordinationOverview(now = new Date()): Promise<CoordinationOverview> {
  const supabase = await createClient();
  const nowIso = now.toISOString();
  const agendaEnd = new Date(now.getTime() + AGENDA_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [missions, projects, content, challenges, partners, agenda, people] = await Promise.all([
    supabase
      .from("mission")
      .select("id, title, status, priority, due_at, project:project_id (slug, name)")
      .not("status", "in", "(done,cancelled)")
      .lt("due_at", nowIso)
      .order("due_at")
      .limit(200),
    supabase.from("project").select("id, slug, name, status, updated_at").in("status", ["active", "completed"]),
    supabase.from("content_item").select("id, title, type, locale, status, updated_at").in("status", ["review", "approved"]).order("updated_at").limit(200),
    supabase.from("research_challenge").select("id, protocol, title, organization_name, status, created_at").eq("status", "received").order("created_at").limit(200),
    supabase.from("organization").select("id, name, stage, created_at").in("stage", ACTIVE_PARTNER_STAGES).is("archived_at", null),
    supabase
      .from("content_item")
      .select("id, title, type, locale, status, event_at, event_place")
      .gte("event_at", nowIso)
      .lte("event_at", agendaEnd)
      .neq("status", "archived")
      .order("event_at")
      .limit(12),
    supabase.from("profile").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const projectRows = projects.data ?? [];
  const projectIds = projectRows.map((p) => p.id);
  const partnerRows = partners.data ?? [];
  const partnerIds = partnerRows.map((o) => o.id);

  // Última atividade do projeto = mais recente entre o próprio projeto, suas missões e o histórico.
  const [events, missionTouches, finalDocs, activities] = await Promise.all([
    projectIds.length ? supabase.from("activity_event").select("project_id, occurred_at").in("project_id", projectIds).order("occurred_at", { ascending: false }).limit(5000) : Promise.resolve({ data: [] }),
    projectIds.length ? supabase.from("mission").select("project_id, updated_at").in("project_id", projectIds).order("updated_at", { ascending: false }).limit(5000) : Promise.resolve({ data: [] }),
    projectIds.length ? supabase.from("project_file").select("project_id").eq("kind", "official_document").in("project_id", projectIds) : Promise.resolve({ data: [] }),
    partnerIds.length
      ? supabase.from("relationship_activity").select("organization_id, occurred_at, next_action, next_action_at").in("organization_id", partnerIds).order("occurred_at", { ascending: false }).limit(5000)
      : Promise.resolve({ data: [] }),
  ]);

  const lastTouch = new Map<string, string>();
  for (const e of (events.data ?? []) as Array<{ project_id: string; occurred_at: string }>) if (!lastTouch.has(e.project_id)) lastTouch.set(e.project_id, e.occurred_at);
  const lastMission = new Map<string, string>();
  for (const m of (missionTouches.data ?? []) as Array<{ project_id: string; updated_at: string }>) if (!lastMission.has(m.project_id)) lastMission.set(m.project_id, m.updated_at);
  const withDocs = new Set(((finalDocs.data ?? []) as Array<{ project_id: string }>).map((d) => d.project_id));
  const lastActivity = new Map<string, { occurred_at: string; next_action: string; next_action_at: string | null }>();
  for (const a of (activities.data ?? []) as Array<{ organization_id: string; occurred_at: string; next_action: string; next_action_at: string | null }>) {
    if (!lastActivity.has(a.organization_id)) lastActivity.set(a.organization_id, a);
  }

  const missionRows = (missions.data ?? []) as unknown as CoordinationInput["missions"];
  const contentRows = (content.data ?? []) as CoordinationInput["content"];
  const challengeRows = (challenges.data ?? []) as CoordinationInput["challenges"];

  return {
    input: {
      missions: missionRows,
      projects: projectRows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        status: p.status,
        lastActivityAt: latest(p.updated_at, lastTouch.get(p.id), lastMission.get(p.id)),
        hasFinalDocument: withDocs.has(p.id),
      })),
      content: contentRows,
      challenges: challengeRows,
      partners: partnerRows.map((o) => {
        const a = lastActivity.get(o.id);
        return { id: o.id, name: o.name, stage: o.stage, created_at: o.created_at, lastActivityAt: a?.occurred_at ?? null, nextAction: a?.next_action ?? "", nextActionAt: a?.next_action_at ?? null };
      }),
    },
    agenda: (agenda.data ?? []) as AgendaItem[],
    counts: {
      activeProjects: projectRows.filter((p) => p.status === "active").length,
      overdueMissions: missionRows.length,
      contentInReview: contentRows.filter((c) => c.status === "review").length,
      challengesReceived: challengeRows.length,
      activePartners: partnerRows.length,
      activePeople: people.count ?? null,
    },
  };
}
