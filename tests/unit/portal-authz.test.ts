import { describe, expect, it } from "vitest";
import {
  canCreateMission, canCreateProject, canManageMission, canManageProject, canTransitionMission, canTransitionProject,
  isMissionLate, MISSION_STATUSES, MISSION_TRANSITIONS, PROJECT_STATUSES, PROJECT_TRANSITIONS, SLUG_RE, slugify, type Actor,
} from "@/lib/portal/authz";

/**
 * Espelho em TS da matriz (11) e das máquinas de estado (10) da migration
 * 20260915000200. Os cenários de banco vivem em tests/rls; aqui garantimos
 * que a UI oferece exatamente o que o servidor aceita.
 */
const admin: Actor = { id: "a", globalRole: "admin", projectRole: null };
const coord: Actor = { id: "c", globalRole: "coordination", projectRole: null };
const advisor: Actor = { id: "d", globalRole: "advisor", projectRole: null };
const leader: Actor = { id: "l", globalRole: "member", projectRole: "leader" };
const member: Actor = { id: "m", globalRole: "member", projectRole: "member" };
const viewer: Actor = { id: "v", globalRole: "viewer", projectRole: "viewer" };
const outsider: Actor = { id: "o", globalRole: "member", projectRole: null };

describe("matriz de papéis (11)", () => {
  it("criar projeto: admin, coordenação e orientador", () => {
    expect([admin, coord, advisor].map((a) => canCreateProject(a.globalRole))).toEqual([true, true, true]);
    expect([leader, member, viewer, outsider].map((a) => canCreateProject(a.globalRole))).toEqual([false, false, false, false]);
  });

  it("gerir projeto: overseers e líder; criar missão: também membro; visualizador e forasteiro não", () => {
    expect([admin, coord, leader].every(canManageProject)).toBe(true);
    expect([advisor, member, viewer, outsider].some(canManageProject)).toBe(false);
    expect([admin, coord, leader, member].every(canCreateMission)).toBe(true);
    expect([viewer, outsider, advisor].some(canCreateMission)).toBe(false);
  });

  it("gerir missão: líder/overseer, autor ou responsável", () => {
    const mission = { createdBy: "m", assigneeIds: ["x"] };
    expect(canManageMission(member, mission)).toBe(true);
    expect(canManageMission({ ...member, id: "x" }, mission)).toBe(true);
    expect(canManageMission({ ...member, id: "y" }, mission)).toBe(false);
    expect(canManageMission(leader, mission)).toBe(true);
  });
});

describe("máquina de estados do projeto (10)", () => {
  it("cadeia rascunho → planejamento → ativo → pausado → concluído → arquivado; cancelado terminal", () => {
    expect(PROJECT_TRANSITIONS.draft).toContain("planned");
    expect(PROJECT_TRANSITIONS.planned).toContain("active");
    expect(PROJECT_TRANSITIONS.active).toEqual(expect.arrayContaining(["paused", "completed"]));
    expect(PROJECT_TRANSITIONS.paused).toContain("active");
    expect(PROJECT_TRANSITIONS.completed).toContain("archived");
    expect(PROJECT_TRANSITIONS.cancelled).toEqual([]);
    for (const s of PROJECT_STATUSES) expect(PROJECT_TRANSITIONS[s]).not.toContain(s);
    expect(PROJECT_TRANSITIONS.planned).not.toContain("archived");
  });

  it("reativar/reabrir é só de overseer; líder faz o resto", () => {
    expect(canTransitionProject(leader, "active", "paused")).toBe(true);
    expect(canTransitionProject(leader, "completed", "archived")).toBe(true);
    expect(canTransitionProject(leader, "archived", "active")).toBe(false);
    expect(canTransitionProject(leader, "completed", "active")).toBe(false);
    expect(canTransitionProject(coord, "archived", "active")).toBe(true);
    expect(canTransitionProject(member, "active", "paused")).toBe(false);
    expect(canTransitionProject(admin, "planned", "completed")).toBe(false);
  });
});

describe("máquina de estados da missão (10)", () => {
  it("Planejada → Em execução → Em validação → Concluída; sem atalho execução → concluída", () => {
    expect(MISSION_TRANSITIONS.planned).toContain("in_progress");
    expect(MISSION_TRANSITIONS.in_progress).toContain("in_validation");
    expect(MISSION_TRANSITIONS.in_progress).not.toContain("done");
    expect(MISSION_TRANSITIONS.in_validation).toEqual(expect.arrayContaining(["done", "in_progress"]));
    expect(MISSION_TRANSITIONS.cancelled).toEqual([]);
    for (const s of MISSION_STATUSES) expect(MISSION_TRANSITIONS[s]).not.toContain(s);
  });

  it("validar, pausar, cancelar e reabrir são do líder/overseer; responsável avança", () => {
    const mission = { createdBy: "z", assigneeIds: ["m"] };
    expect(canTransitionMission(member, mission, "planned", "in_progress")).toBe(true);
    expect(canTransitionMission(member, mission, "in_progress", "in_validation")).toBe(true);
    expect(canTransitionMission(member, mission, "in_validation", "done")).toBe(false);
    expect(canTransitionMission(member, mission, "in_progress", "paused")).toBe(false);
    expect(canTransitionMission(leader, mission, "in_validation", "done")).toBe(true);
    expect(canTransitionMission(leader, mission, "done", "in_progress")).toBe(true);
    expect(canTransitionMission(member, mission, "done", "in_progress")).toBe(false);
    expect(canTransitionMission({ ...member, id: "y" }, mission, "planned", "in_progress")).toBe(false);
  });

  it("atrasada é derivada: prazo passado e não terminal", () => {
    const now = new Date("2026-09-15T12:00:00Z");
    expect(isMissionLate({ status: "in_progress", due_at: "2026-09-14T12:00:00Z" }, now)).toBe(true);
    expect(isMissionLate({ status: "done", due_at: "2026-09-14T12:00:00Z" }, now)).toBe(false);
    expect(isMissionLate({ status: "in_progress", due_at: "2026-09-16T12:00:00Z" }, now)).toBe(false);
    expect(isMissionLate({ status: "planned", due_at: null }, now)).toBe(false);
  });
});

describe("slug", () => {
  it("normaliza acentos/espaços e respeita o CHECK do banco", () => {
    expect(slugify("Comunica Ferro — 2026!")).toBe("comunica-ferro-2026");
    expect(slugify("  Ágora Tech  ")).toBe("agora-tech");
    expect(SLUG_RE.test(slugify("---"))).toBe(false);
    expect(SLUG_RE.test("abc-def")).toBe(true);
    expect(SLUG_RE.test("Abc")).toBe(false);
  });
});
