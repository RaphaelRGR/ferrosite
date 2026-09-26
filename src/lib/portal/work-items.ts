import { institutionalDate } from "@/i18n/format";
import type { Enums } from "@/types/database";

/**
 * Ações (ACT-001): espelho puro das regras da migration 20260927000100 para a
 * interface decidir o que mostrar e as Server Actions validarem cedo. Quem
 * decide de verdade é o banco (trigger `guard_work_item_update` + RLS).
 * Importável por Client Components (sem código de servidor).
 */
export type WorkItemKind = Enums<"work_item_kind">;
export type WorkItemStatus = Enums<"work_item_status">;
export type WaitingParty = Enums<"waiting_party">;
export type WorkItemPriority = Enums<"mission_priority">;

export const WORK_ITEM_KINDS: WorkItemKind[] = ["action", "approval", "decision", "follow_up"];
export const WORK_ITEM_STATUSES: WorkItemStatus[] = ["inbox", "planned", "in_progress", "waiting", "blocked", "awaiting_approval", "done", "cancelled"];
export const WAITING_PARTIES: WaitingParty[] = ["coordination", "admin", "professor", "student", "company", "supplier", "secretariat", "transport", "ufsc", "other"];
export const WORK_ITEM_PRIORITIES: WorkItemPriority[] = ["high", "medium", "low"];

/** Espelho do trigger. */
export const WORK_ITEM_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  inbox: ["planned", "in_progress", "cancelled"],
  planned: ["in_progress", "waiting", "blocked", "awaiting_approval", "done", "cancelled"],
  in_progress: ["planned", "waiting", "blocked", "awaiting_approval", "done", "cancelled"],
  waiting: ["in_progress", "planned", "blocked", "awaiting_approval", "done", "cancelled"],
  blocked: ["in_progress", "planned", "waiting", "cancelled"],
  awaiting_approval: ["done", "in_progress", "cancelled"],
  done: ["in_progress"],
  cancelled: ["planned", "inbox"],
};

const CLOSED: WorkItemStatus[] = ["done", "cancelled"];
/** Estados em que o próximo passo é de quem responde pela ação (não de terceiros nem do aprovador). */
const ACTIONABLE: WorkItemStatus[] = ["inbox", "planned", "in_progress", "blocked"];

export interface WorkItemLike {
  id: string;
  kind: WorkItemKind;
  status: WorkItemStatus;
  owner_id: string | null;
  approver_id: string | null;
  due_at: string | null;
  waiting_on: WaitingParty | null;
  waiting_since: string | null;
  snoozed_until: string | null;
}

export interface WorkActor {
  id: string;
  /** admin ou coordenação */
  overseer: boolean;
}

export const isOpen = (s: WorkItemStatus) => !CLOSED.includes(s);
export const isActionable = (s: WorkItemStatus) => ACTIONABLE.includes(s);
export const isSnoozed = (i: Pick<WorkItemLike, "snoozed_until">, now: Date) => !!i.snoozed_until && new Date(i.snoozed_until).getTime() > now.getTime();
export const isOverdue = (i: Pick<WorkItemLike, "status" | "due_at">, now: Date) => isOpen(i.status) && !!i.due_at && new Date(i.due_at).getTime() < now.getTime();

/** O que o botão de uma transição significa para quem está olhando. */
export type WorkTransition =
  | { to: "in_progress"; label: "start" | "resume" | "reopen" }
  | { to: "waiting"; label: "wait" }
  | { to: "blocked"; label: "block" }
  | { to: "awaiting_approval"; label: "requestApproval" }
  | { to: "done"; label: "complete" | "approve" }
  | { to: "in_progress"; label: "requestChanges" }
  | { to: "planned" | "inbox"; label: "reopen" }
  | { to: "cancelled"; label: "cancel" | "archive" };

/**
 * Botões de andamento que a pessoa pode usar agora. Mesma regra do banco:
 * aprovar/pedir alteração só para o aprovador; item com aprovador só conclui
 * pela aprovação; reabrir e cancelar são da administração/coordenação.
 */
export function availableTransitions(item: WorkItemLike, actor: WorkActor): WorkTransition[] {
  const isOwner = item.owner_id === actor.id;
  const isApprover = item.approver_id === actor.id;
  const canWork = actor.overseer || isOwner;
  const out: WorkTransition[] = [];
  const s = item.status;

  if (s === "awaiting_approval") {
    if (isApprover) out.push({ to: "done", label: "approve" }, { to: "in_progress", label: "requestChanges" });
    if (actor.overseer) out.push({ to: "cancelled", label: "cancel" });
    return out;
  }
  if (s === "done") return actor.overseer ? [{ to: "in_progress", label: "reopen" }] : [];
  // Reabrir: sem responsável volta para a Entrada.
  if (s === "cancelled") return actor.overseer ? [{ to: item.owner_id ? "planned" : "inbox", label: "reopen" }] : [];
  // Entrada: aceitar (responsável + prazo) é um formulário próprio; aqui só arquivar.
  if (s === "inbox") return actor.overseer ? [{ to: "cancelled", label: "archive" }] : [];
  if (!canWork) return out;

  if (s === "planned") out.push({ to: "in_progress", label: "start" });
  if (s === "waiting" || s === "blocked") out.push({ to: "in_progress", label: "resume" });
  if (s !== "waiting") out.push({ to: "waiting", label: "wait" });
  if (s !== "blocked") out.push({ to: "blocked", label: "block" });
  if (s !== "blocked" && item.kind !== "decision") {
    if (item.approver_id && item.approver_id !== item.owner_id) out.push({ to: "awaiting_approval", label: "requestApproval" });
    else if (!item.approver_id) out.push({ to: "done", label: "complete" });
  }
  if (actor.overseer) out.push({ to: "cancelled", label: "cancel" });
  return out;
}

/** Registrar a decisão (itens do tipo decisão ainda abertos): responsável ou admin/coordenação. */
export const canDecide = (item: WorkItemLike, actor: WorkActor) => item.kind === "decision" && isOpen(item.status) && item.status !== "awaiting_approval" && (actor.overseer || item.owner_id === actor.id);

/** Editar dados (título, responsável, prazo, aprovador…): só administração e coordenação. */
export const canEditDetails = (actor: WorkActor) => actor.overseer;

// ─── Prazo ──────────────────────────────────────────────────────────────────
export const DUE_PRESETS = ["today", "tomorrow", "week", "none", "date"] as const;
export type DuePreset = (typeof DUE_PRESETS)[number];
/** Hora padrão quando só o dia é escolhido (fim da tarde no fuso do curso). */
export const DEFAULT_DUE_TIME = "18:00";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dia da semana (0 = domingo) de uma data civil. */
const weekday = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`).getUTCDay();

/**
 * "Quando?" da criação rápida → instante ISO no fuso do curso (-03:00).
 * Esta semana = sexta-feira (ou o próprio dia, se já for sexta ou fim de semana).
 * `undefined` = entrada inválida; `null` = sem prazo.
 */
export function resolveDue(preset: string, date: string, time: string, now = new Date()): string | null | undefined {
  const t = time && TIME.test(time) ? time : DEFAULT_DUE_TIME;
  const today = institutionalDate(now);
  let day: string;
  switch (preset) {
    case "none":
      return null;
    case "today":
      day = today;
      break;
    case "tomorrow":
      day = addDays(today, 1);
      break;
    case "week": {
      const w = weekday(today);
      day = w >= 5 || w === 0 ? today : addDays(today, 5 - w);
      break;
    }
    case "date":
      if (!DATE.test(date)) return undefined;
      day = date;
      break;
    default:
      return undefined;
  }
  return new Date(`${day}T${t}:00-03:00`).toISOString();
}

// ─── Lembrar depois ─────────────────────────────────────────────────────────
export const SNOOZE_PRESETS = ["tomorrow", "next_week", "next_month", "date"] as const;
export type SnoozePreset = (typeof SNOOZE_PRESETS)[number];
/** Hora em que o item adiado volta à mesa (início do expediente no fuso do curso). */
export const SNOOZE_TIME = "08:00";

/** Amanhã · segunda que vem · mesmo dia do mês seguinte (ou o último dia) · data escolhida; sempre às 08:00. */
export function resolveSnooze(preset: string, date: string, now = new Date()): string | undefined {
  const today = institutionalDate(now);
  let day: string;
  switch (preset) {
    case "tomorrow":
      day = addDays(today, 1);
      break;
    case "next_week": {
      const w = weekday(today);
      day = addDays(today, w === 0 ? 1 : 8 - w);
      break;
    }
    case "next_month": {
      const [y, m, d] = today.split("-").map(Number);
      const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      day = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
      break;
    }
    case "date":
      if (!DATE.test(date) || date <= today) return undefined;
      day = date;
      break;
    default:
      return undefined;
  }
  return new Date(`${day}T${SNOOZE_TIME}:00-03:00`).toISOString();
}

// ─── Abas da lista de ações ─────────────────────────────────────────────────
export const WORK_TABS = ["entrada", "abertas", "bloqueios", "aprovacoes", "adiadas", "concluidas"] as const;
export type WorkTab = (typeof WORK_TABS)[number];

/**
 * Itens abertos de cada aba (Concluídas vem de outra consulta). Adiados saem de
 * todas as abas até a data e ficam só em "Adiadas". Bloqueios = tudo que está
 * parado por alguém ou algo: aguardando terceiros, bloqueado, aguardando aprovação.
 */
export function filterTab<T extends WorkItemLike>(tab: WorkTab, items: T[], now = new Date()): T[] {
  if (tab === "adiadas") return items.filter((i) => isOpen(i.status) && isSnoozed(i, now));
  const active = items.filter((i) => isOpen(i.status) && !isSnoozed(i, now));
  const statuses: Record<Exclude<WorkTab, "adiadas">, WorkItemStatus[]> = {
    entrada: ["inbox"],
    abertas: ["planned", "in_progress"],
    bloqueios: ["waiting", "blocked", "awaiting_approval"],
    aprovacoes: ["awaiting_approval"],
    concluidas: ["done", "cancelled"],
  };
  return active.filter((i) => statuses[tab].includes(i.status));
}

// ─── Minha Mesa e visão da coordenação ──────────────────────────────────────
export interface DeskSections<T extends WorkItemLike> {
  overdue: T[];
  today: T[];
  /** Aprovações pedidas a mim e decisões que são minhas. */
  forMe: T[];
  /** Meus itens parados esperando aprovação de outra pessoa. */
  awaitingApproval: T[];
  /** Meus itens esperando terceiros ("aguardando quem"). */
  waiting: T[];
  next7: T[];
  later: T[];
  snoozed: number;
}

const byDue = <T extends WorkItemLike>(a: T, b: T) => (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999");

/** Separa as ações do usuário nas seções da Minha Mesa (cada item em uma seção só). */
export function buildDesk<T extends WorkItemLike>(items: T[], userId: string, now = new Date()): DeskSections<T> {
  const today = institutionalDate(now);
  const limit7 = addDays(today, 7);
  const out: DeskSections<T> = { overdue: [], today: [], forMe: [], awaitingApproval: [], waiting: [], next7: [], later: [], snoozed: 0 };
  for (const i of items) {
    if (!isOpen(i.status)) continue;
    const mine = i.owner_id === userId;
    const approvalForMe = i.status === "awaiting_approval" && i.approver_id === userId;
    if (!mine && !approvalForMe) continue;
    if (isSnoozed(i, now)) {
      out.snoozed++;
      continue;
    }
    if (approvalForMe || (mine && i.kind === "decision" && isActionable(i.status))) out.forMe.push(i);
    else if (i.status === "awaiting_approval") out.awaitingApproval.push(i);
    else if (i.status === "waiting") out.waiting.push(i);
    else if (isOverdue(i, now)) out.overdue.push(i);
    else if (i.due_at && institutionalDate(new Date(i.due_at)) === today) out.today.push(i);
    else if (i.due_at && institutionalDate(new Date(i.due_at)) <= limit7) out.next7.push(i);
    else out.later.push(i);
  }
  for (const k of ["overdue", "today", "forMe", "awaitingApproval", "next7", "later"] as const) out[k].sort(byDue);
  out.waiting.sort((a, b) => (a.waiting_since ?? "").localeCompare(b.waiting_since ?? ""));
  return out;
}

/** Itens abertos por responsável (exceto quem olha), do maior para o menor. */
export function teamLoad<T extends WorkItemLike>(items: T[], exceptUserId: string): Array<{ ownerId: string; count: number }> {
  const m = new Map<string, number>();
  for (const i of items) if (isOpen(i.status) && i.owner_id && i.owner_id !== exceptUserId) m.set(i.owner_id, (m.get(i.owner_id) ?? 0) + 1);
  return [...m.entries()].map(([ownerId, count]) => ({ ownerId, count })).sort((a, b) => b.count - a.count);
}

/** Itens em espera agrupados por "aguardando quem" (tela de aguardando/bloqueios). */
export function groupByWaiting<T extends WorkItemLike>(items: T[]): Array<{ party: WaitingParty; items: T[] }> {
  return WAITING_PARTIES.map((party) => ({ party, items: items.filter((i) => i.status === "waiting" && i.waiting_on === party) })).filter((g) => g.items.length > 0);
}

/** Próximos prazos (abertos, não adiados), do mais próximo. */
export function upcoming<T extends WorkItemLike>(items: T[], now = new Date(), limit = 6): T[] {
  return items.filter((i) => isOpen(i.status) && i.due_at && !isSnoozed(i, now) && new Date(i.due_at).getTime() >= now.getTime()).sort(byDue).slice(0, limit);
}

/** "Hoje", "Amanhã" ou a data curta, no fuso do curso. */
export function dueDay(iso: string, now = new Date()): "today" | "tomorrow" | string {
  const d = institutionalDate(new Date(iso));
  const today = institutionalDate(now);
  if (d === today) return "today";
  if (d === addDays(today, 1)) return "tomorrow";
  return d;
}

