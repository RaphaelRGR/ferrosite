import { describe, expect, it } from "vitest";
import { getDictionary } from "@/i18n/dictionaries";
import {
  availableTransitions, buildDesk, canDecide, dueDay, filterTab, groupByWaiting, resolveDue, resolveSnooze, teamLoad, upcoming,
  WAITING_PARTIES, WORK_ITEM_KINDS, WORK_ITEM_STATUSES, WORK_ITEM_TRANSITIONS, type WorkItemLike,
} from "@/lib/portal/work-items";

/**
 * Espelho das regras das ações (ACT-001). O banco é a autoridade
 * (tests/rls/work-items.test.ts); aqui garantimos que a interface oferece
 * exatamente o que o servidor aceita e que a Minha Mesa separa bem o trabalho.
 */
const NOW = new Date("2026-09-26T15:00:00Z"); // 12:00 em Joinville, sábado
const at = (hoursFromNow: number) => new Date(NOW.getTime() + hoursFromNow * 3600_000).toISOString();
let seq = 0;
const item = (over: Partial<WorkItemLike> = {}): WorkItemLike => ({
  id: `i${++seq}`, kind: "action", status: "planned", owner_id: "me", approver_id: null, due_at: null, waiting_on: null, waiting_since: null, snoozed_until: null, ...over,
});
const labels = (i: WorkItemLike, actor = { id: "me", overseer: false }) => availableTransitions(i, actor).map((t) => t.label);

describe("transições oferecidas", () => {
  it("cada botão respeita a máquina de estados do banco", () => {
    for (const status of WORK_ITEM_STATUSES) {
      for (const who of [{ id: "me", overseer: true }, { id: "me", overseer: false }, { id: "approver", overseer: false }]) {
        const i = item({ status, approver_id: status === "awaiting_approval" ? "approver" : null });
        for (const t of availableTransitions(i, who)) expect(WORK_ITEM_TRANSITIONS[status], `${status} → ${t.to}`).toContain(t.to);
      }
    }
  });

  it("item com aprovador só conclui pela aprovação; sem aprovador conclui direto", () => {
    expect(labels(item({ approver_id: "coord" }))).toContain("requestApproval");
    expect(labels(item({ approver_id: "coord" }))).not.toContain("complete");
    expect(labels(item())).toContain("complete");
  });

  it("aprovar e pedir alteração só para o aprovador, nem o dono admin", () => {
    const waiting = item({ status: "awaiting_approval", approver_id: "coord" });
    expect(labels(waiting, { id: "coord", overseer: true })).toEqual(["approve", "requestChanges", "cancel"]);
    expect(labels(waiting, { id: "me", overseer: true })).toEqual(["cancel"]);
    expect(labels(waiting, { id: "me", overseer: false })).toEqual([]);
  });

  it("quem não é dono nem coordenação não anda com o item; reabrir é da coordenação", () => {
    expect(labels(item(), { id: "outro", overseer: false })).toEqual([]);
    expect(labels(item({ status: "done" }))).toEqual([]);
    expect(labels(item({ status: "done" }), { id: "me", overseer: true })).toEqual(["reopen"]);
  });

  it("decisão se registra, não se conclui por botão", () => {
    const d = item({ kind: "decision" });
    expect(labels(d)).not.toContain("complete");
    expect(canDecide(d, { id: "me", overseer: false })).toBe(true);
    expect(canDecide(d, { id: "outro", overseer: false })).toBe(false);
    expect(canDecide(item(), { id: "me", overseer: true })).toBe(false);
  });
});

describe("prazo da criação rápida", () => {
  it("hoje, amanhã, esta semana (sexta) e data escolhida no fuso do curso, 18:00 por padrão", () => {
    const wed = new Date("2026-09-23T15:00:00Z");
    expect(resolveDue("today", "", "", wed)).toBe("2026-09-23T21:00:00.000Z");
    expect(resolveDue("tomorrow", "", "11:00", wed)).toBe("2026-09-24T14:00:00.000Z");
    expect(resolveDue("week", "", "", wed)).toBe("2026-09-25T21:00:00.000Z");
    expect(resolveDue("week", "", "", NOW)).toBe("2026-09-26T21:00:00.000Z"); // sábado: o próprio dia
    expect(resolveDue("date", "2026-10-12", "09:30", wed)).toBe("2026-10-12T12:30:00.000Z");
    expect(resolveDue("none", "", "", wed)).toBeNull();
    expect(resolveDue("date", "12/10", "", wed)).toBeUndefined();
    expect(resolveDue("depois", "", "", wed)).toBeUndefined();
  });

  it("perto da meia-noite usa o dia de Joinville, não o UTC", () => {
    const lateNight = new Date("2026-09-24T02:30:00Z"); // 23:30 do dia 23 em Joinville
    expect(resolveDue("today", "", "", lateNight)).toBe("2026-09-23T21:00:00.000Z");
  });
});

describe("Minha Mesa", () => {
  it("cada item cai em uma seção só, na ordem de urgência", () => {
    const items = [
      item({ id: "late", due_at: at(-2) }),
      item({ id: "today", due_at: at(3) }),
      item({ id: "week", due_at: at(72) }),
      item({ id: "later", due_at: at(24 * 30) }),
      item({ id: "nodue" }),
      item({ id: "approvalForMe", owner_id: "raphael", approver_id: "me", status: "awaiting_approval" }),
      item({ id: "decision", kind: "decision" }),
      item({ id: "waitingApproval", approver_id: "coord", status: "awaiting_approval" }),
      item({ id: "thirdParty", status: "waiting", waiting_on: "company", waiting_since: at(-48) }),
      item({ id: "notMine", owner_id: "raphael" }),
      item({ id: "done", status: "done" }),
      item({ id: "snoozed", snoozed_until: at(24) }),
    ];
    const d = buildDesk(items, "me", NOW);
    expect(d.overdue.map((i) => i.id)).toEqual(["late"]);
    expect(d.today.map((i) => i.id)).toEqual(["today"]);
    expect(d.forMe.map((i) => i.id).sort()).toEqual(["approvalForMe", "decision"]);
    expect(d.awaitingApproval.map((i) => i.id)).toEqual(["waitingApproval"]);
    expect(d.waiting.map((i) => i.id)).toEqual(["thirdParty"]);
    expect(d.next7.map((i) => i.id)).toEqual(["week"]);
    expect(d.later.map((i) => i.id).sort()).toEqual(["later", "nodue"]);
    expect(d.snoozed).toBe(1);
  });

  it("carga da equipe, agrupamento por quem é aguardado e próximos prazos", () => {
    const items = [
      item({ owner_id: "raphael" }), item({ owner_id: "raphael" }), item({ owner_id: "amandha" }), item({ owner_id: "me" }),
      item({ owner_id: "raphael", status: "done" }),
      item({ status: "waiting", waiting_on: "company" }), item({ status: "waiting", waiting_on: "company" }), item({ status: "waiting", waiting_on: "supplier" }),
    ];
    expect(teamLoad(items, "me")).toEqual([{ ownerId: "raphael", count: 2 }, { ownerId: "amandha", count: 1 }]);
    expect(groupByWaiting(items).map((g) => [g.party, g.items.length])).toEqual([["company", 2], ["supplier", 1]]);
    const up = upcoming([item({ id: "b", due_at: at(10) }), item({ id: "a", due_at: at(5) }), item({ id: "past", due_at: at(-1) })], NOW);
    expect(up.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("prazo mostrado como hoje/amanhã no fuso do curso", () => {
    expect(dueDay(at(3), NOW)).toBe("today");
    expect(dueDay(at(20), NOW)).toBe("tomorrow");
    expect(dueDay(at(48), NOW)).toBe("2026-09-28");
  });
});

describe("textos", () => {
  it("todos os estados, tipos, partes aguardadas e botões têm rótulo em PT e EN", () => {
    for (const locale of ["pt", "en"] as const) {
      const w = getDictionary(locale).portal.workItems;
      for (const s of WORK_ITEM_STATUSES) expect(w.statuses[s]).toBeTruthy();
      for (const k of WORK_ITEM_KINDS) expect(w.kinds[k]).toBeTruthy();
      for (const p of WAITING_PARTIES) expect(w.waitingParties[p]).toBeTruthy();
      for (const t of ["start", "resume", "wait", "block", "requestApproval", "complete", "approve", "requestChanges", "reopen", "cancel"] as const) expect(w.transitions[t]).toBeTruthy();
    }
  });
});

describe("etapa 2: Entrada, lembrar depois e abas", () => {
  it("na Entrada só se arquiva por botão (aceitar é o formulário de triagem)", () => {
    expect(availableTransitions(item({ status: "inbox", owner_id: null }), { id: "me", overseer: true })).toEqual([{ to: "cancelled", label: "archive" }]);
    expect(availableTransitions(item({ status: "inbox", owner_id: null }), { id: "me", overseer: false })).toEqual([]);
  });

  it("lembrar depois volta às 08:00 no fuso do curso", () => {
    const wed = new Date("2026-09-23T15:00:00Z");
    expect(resolveSnooze("tomorrow", "", wed)).toBe("2026-09-24T11:00:00.000Z");
    expect(resolveSnooze("next_week", "", wed)).toBe("2026-09-28T11:00:00.000Z"); // segunda
    expect(resolveSnooze("next_week", "", new Date("2026-09-27T15:00:00Z"))).toBe("2026-09-28T11:00:00.000Z"); // domingo
    expect(resolveSnooze("next_month", "", wed)).toBe("2026-10-23T11:00:00.000Z");
    expect(resolveSnooze("next_month", "", new Date("2027-01-31T15:00:00Z"))).toBe("2027-02-28T11:00:00.000Z");
    expect(resolveSnooze("next_month", "", new Date("2026-12-15T15:00:00Z"))).toBe("2027-01-15T11:00:00.000Z");
    expect(resolveSnooze("date", "2026-10-05", wed)).toBe("2026-10-05T11:00:00.000Z");
    expect(resolveSnooze("date", "2026-09-23", wed)).toBeUndefined(); // hoje não é "depois"
    expect(resolveSnooze("amanha", "", wed)).toBeUndefined();
  });

  it("abas: adiados saem de todas e ficam só em Adiadas; Bloqueios junta aguardando, bloqueadas e aprovação", () => {
    const items = [
      item({ id: "inbox", status: "inbox", owner_id: null }),
      item({ id: "planned" }),
      item({ id: "progress", status: "in_progress" }),
      item({ id: "waiting", status: "waiting", waiting_on: "company" }),
      item({ id: "blocked", status: "blocked" }),
      item({ id: "approval", status: "awaiting_approval", approver_id: "coord" }),
      item({ id: "snoozed", snoozed_until: at(24) }),
      item({ id: "woke", snoozed_until: at(-1) }),
      item({ id: "done", status: "done" }),
    ];
    const ids = (tab: Parameters<typeof filterTab>[0]) => filterTab(tab, items, NOW).map((i) => i.id);
    expect(ids("entrada")).toEqual(["inbox"]);
    expect(ids("abertas")).toEqual(["planned", "progress", "woke"]);
    expect(ids("bloqueios")).toEqual(["waiting", "blocked", "approval"]);
    expect(ids("aprovacoes")).toEqual(["approval"]);
    expect(ids("adiadas")).toEqual(["snoozed"]);
  });

  it("reabrir cancelado sem responsável volta para a Entrada", () => {
    expect(availableTransitions(item({ status: "cancelled", owner_id: null }), { id: "me", overseer: true })).toEqual([{ to: "inbox", label: "reopen" }]);
    expect(availableTransitions(item({ status: "cancelled" }), { id: "me", overseer: true })).toEqual([{ to: "planned", label: "reopen" }]);
  });
});
