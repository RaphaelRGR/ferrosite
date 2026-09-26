import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { transitionMission } from "@/lib/portal/actions/missions";
import { canTransitionMission, isMissionLate, MISSION_TRANSITIONS, type Actor, type MissionStatus } from "@/lib/portal/authz";
import type { MissionWithAssignees } from "@/lib/portal/queries/missions";
import { StatusActions, type StatusTarget } from "./StatusActions";

export const MISSION_STATUS_TONE: Record<MissionStatus, BadgeTone> = {
  planned: "neutral",
  in_progress: "info",
  in_validation: "warning",
  done: "success",
  paused: "neutral",
  cancelled: "danger",
};

export function missionTargets(actor: Actor, m: MissionWithAssignees, dict: Dictionary["portal"]): StatusTarget[] {
  const ctx = { createdBy: m.created_by, assigneeIds: m.assignees.map((a) => a.profile_id) };
  return MISSION_TRANSITIONS[m.status]
    .filter((to) => canTransitionMission(actor, ctx, m.status, to))
    .map((to) => ({ to, label: dict.missions.transition.replace("{status}", dict.missions.status[to]), variant: to === "cancelled" ? "danger" : to === "done" || to === "in_progress" ? "primary" : "secondary" }));
}

/** Card de missão usado na lista, no Kanban e no calendário — mesma entidade, mesma action de transição (10). */
export function MissionCard({ mission, slug, actor, dict, compact = false }: { mission: MissionWithAssignees; slug: string; actor: Actor; dict: Dictionary["portal"]; compact?: boolean }) {
  const late = isMissionLate(mission);
  const targets = missionTargets(actor, mission, dict);
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4" aria-labelledby={`m-${mission.id}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={MISSION_STATUS_TONE[mission.status]}>{dict.missions.status[mission.status]}</Badge>
        {late && <Badge tone="danger">{dict.missions.late}</Badge>}
        <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{dict.missions.priorities[mission.priority]}</span>
      </div>
      <h3 id={`m-${mission.id}`} className="font-bold leading-snug">
        <Link href={`/portal/projetos/${slug}/missoes/${mission.id}`} className="rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {mission.title}
        </Link>
      </h3>
      <p className="text-xs text-fg-muted">
        {dict.missions.dueAt}: {mission.due_at ? formatDate("pt", new Date(mission.due_at), { dateStyle: "short", timeStyle: "short" }) : dict.missions.noDue}
      </p>
      {mission.assignees.length > 0 && (
        <p className="text-xs text-fg-muted">
          {dict.missions.assignees}: {mission.assignees.map((a) => a.profile?.full_name || a.profile?.email || "").join(", ")}
        </p>
      )}
      {!compact && targets.length > 0 && (
        <StatusActions action={transitionMission} hidden={{ id: mission.id, slug, version: String(mission.version) }} from={mission.status} targets={targets} dict={dict} label={`${dict.projects.transition}: ${mission.title}`} />
      )}
    </article>
  );
}
