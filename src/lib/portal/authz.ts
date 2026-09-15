import type { Enums } from "@/types/database";

/**
 * Autorização e máquinas de estado (10/11) — espelho da migration
 * 20260915000200 para a UI decidir o que mostrar e as actions validarem cedo.
 * A decisão final é sempre do servidor/RLS: nada aqui substitui as policies.
 */
export type GlobalRole = Enums<"global_role">;
export type ProjectRole = Enums<"project_role">;
export type ProjectStatus = Enums<"project_status">;
export type MissionStatus = Enums<"mission_status">;

export type ProjectCategory = "research" | "extension" | "competition" | "communication" | "rd" | "other";
export const PROJECT_CATEGORIES: ProjectCategory[] = ["research", "extension", "competition", "communication", "rd", "other"];
export type Classification = Enums<"classification">;
export const CLASSIFICATIONS: Classification[] = ["public", "internal", "restricted", "administrative"];

export const PROJECT_STATUSES: ProjectStatus[] = ["draft", "planned", "active", "paused", "completed", "archived", "cancelled"];
export const MISSION_STATUSES: MissionStatus[] = ["planned", "in_progress", "in_validation", "done", "paused", "cancelled"];

/** 10: rascunho → planejamento → ativo → pausado → concluído → arquivado; cancelado terminal. */
export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ["planned", "active", "cancelled"],
  planned: ["draft", "active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "cancelled"],
  completed: ["archived", "active"],
  archived: ["active", "planned"],
  cancelled: [],
};

/** 10: Planejada → Em execução → Em validação → Concluída; Pausada/Cancelada por transição autorizada. */
export const MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  planned: ["in_progress", "paused", "cancelled"],
  in_progress: ["in_validation", "paused", "cancelled"],
  in_validation: ["done", "in_progress", "cancelled"],
  paused: ["in_progress", "cancelled"],
  done: ["in_progress"],
  cancelled: [],
};

/** Transições de missão reservadas a líder/overseer (validar, pausar, cancelar, reabrir). */
export const MISSION_PRIVILEGED_TARGETS: MissionStatus[] = ["done", "paused", "cancelled"];

export function isOverseer(role: GlobalRole | null | undefined): boolean {
  return role === "admin" || role === "coordination";
}

export function canCreateProject(role: GlobalRole | null | undefined): boolean {
  return role === "admin" || role === "coordination" || role === "advisor";
}

export function canManagePeople(role: GlobalRole | null | undefined): boolean {
  return isOverseer(role);
}

/** Só admin altera papel global/status (trigger guard_profile_privileges). */
export function canChangePrivileges(role: GlobalRole | null | undefined): boolean {
  return role === "admin";
}

export interface Actor {
  id: string;
  globalRole: GlobalRole;
  /** Papel vigente no projeto em questão (null = não é membro). */
  projectRole: ProjectRole | null;
}

export function canManageProject(actor: Actor): boolean {
  return isOverseer(actor.globalRole) || actor.projectRole === "leader";
}

export function canCreateMission(actor: Actor): boolean {
  return isOverseer(actor.globalRole) || actor.projectRole === "leader" || actor.projectRole === "member";
}

export function canManageMission(actor: Actor, mission: { createdBy: string; assigneeIds: string[] }): boolean {
  return canManageProject(actor) || mission.createdBy === actor.id || mission.assigneeIds.includes(actor.id);
}

export function projectTransitionAllowed(from: ProjectStatus, to: ProjectStatus): boolean {
  return PROJECT_TRANSITIONS[from].includes(to);
}

/** Reativar (sair de arquivado) e reabrir concluído são de overseer. */
export function canTransitionProject(actor: Actor, from: ProjectStatus, to: ProjectStatus): boolean {
  if (!projectTransitionAllowed(from, to) || !canManageProject(actor)) return false;
  if (from === "archived" || (from === "completed" && to === "active")) return isOverseer(actor.globalRole);
  return true;
}

export function missionTransitionAllowed(from: MissionStatus, to: MissionStatus): boolean {
  return MISSION_TRANSITIONS[from].includes(to);
}

export function canTransitionMission(actor: Actor, mission: { createdBy: string; assigneeIds: string[] }, from: MissionStatus, to: MissionStatus): boolean {
  if (!missionTransitionAllowed(from, to) || !canManageMission(actor, mission)) return false;
  if (MISSION_PRIVILEGED_TARGETS.includes(to) || from === "done") return canManageProject(actor);
  return true;
}

/** "Atrasada" é condição derivada, nunca estado (10). */
export function isMissionLate(mission: { status: MissionStatus; due_at: string | null }, now = new Date()): boolean {
  if (!mission.due_at || mission.status === "done" || mission.status === "cancelled") return false;
  return new Date(mission.due_at).getTime() < now.getTime();
}

/** Slug de projeto (mesma regra do CHECK no banco). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
