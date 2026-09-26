"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { findTemplate } from "@/content/work-templates";
import type { Json } from "@/types/database";
import { dispatchQuietly } from "@/lib/mail/dispatch";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { isOverseer } from "@/lib/portal/authz";
import { getWorkItem } from "@/lib/portal/queries/work-items";
import {
  availableTransitions, buildProcessItems, canDecide, isOpen, resolveDue, resolveSnooze, WAITING_PARTIES, WORK_ITEM_KINDS, WORK_ITEM_PRIORITIES, WORK_ITEM_STATUSES,
  type WaitingParty, type WorkActor, type WorkItemKind, type WorkItemPriority, type WorkItemStatus,
} from "@/lib/portal/work-items";

/**
 * Server Actions das ações (ACT-001). Validam cedo com o espelho de
 * `lib/portal/work-items.ts`; quem decide é o banco (trigger + RLS). Toda
 * mudança relevante vira histórico pelo próprio banco.
 */
async function actor(): Promise<WorkActor | ActionState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  return { id: s.user.id, overseer: isOverseer(s.profile.global_role) };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);
const uuidOrNull = (v: string) => (/^[0-9a-f-]{36}$/.test(v) ? v : null);

function revalidateWork(id?: string) {
  // avisos por e-mail (recebeu ação, aprovação, alteração, menção) já estão na fila do banco (ACT-004)
  after(dispatchQuietly);
  revalidatePath("/portal");
  revalidatePath("/portal/coordenacao");
  revalidatePath("/portal/acoes");
  if (id) revalidatePath(`/portal/acoes/${id}`);
}

/** Campos opcionais ("Mais opções") comuns a criar e editar. */
function readOptional(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const kind = (str(fd, "kind") || "action") as WorkItemKind;
  if (!WORK_ITEM_KINDS.includes(kind)) return { error: "invalid", field: "kind" };
  const priority = (str(fd, "priority") || "medium") as WorkItemPriority;
  if (!WORK_ITEM_PRIORITIES.includes(priority)) return { error: "invalid", field: "priority" };
  const approver = uuidOrNull(str(fd, "approver_id"));
  if (kind === "approval" && !approver) return { error: "invalid", field: "approver_id" };
  // Opções de decisão: uma por linha, até 8, sem repetição.
  const options = kind === "decision" ? [...new Set(str(fd, "decision_options", 2000).split(/\r?\n/).map((o) => o.trim().slice(0, 200)).filter(Boolean))] : [];
  if (options.length > 8) return { error: "invalid", field: "decision_options" };
  return {
    fields: {
      kind,
      decision_options: options,
      priority,
      description: str(fd, "description", 4000),
      approver_id: approver,
      project_id: uuidOrNull(str(fd, "project_id")),
      organization_id: uuidOrNull(str(fd, "organization_id")),
      // missão só quando o formulário a traz (criada a partir da missão; a edição preserva): o banco herda o projeto dela
      ...(fd.has("mission_id") ? { mission_id: uuidOrNull(str(fd, "mission_id")) } : {}),
    },
  };
}

export async function createWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  if (!a.overseer) return fail(fd, { error: "forbidden" });
  const title = str(fd, "title", 200);
  if (title.length < 2) return fail(fd, { error: "invalid", field: "title" });
  // Sem responsável = Entrada (triagem depois).
  const owner = uuidOrNull(str(fd, "owner_id"));
  const due = resolveDue(str(fd, "when") || "none", str(fd, "due_date", 10), str(fd, "due_time", 5));
  if (due === undefined) return fail(fd, { error: "invalid", field: "due_date" });
  const opt = readOptional(fd);
  if (isState(opt)) return fail(fd, opt);
  // Pedido de aprovação já na criação: o tipo "aprovação" nasce aguardando o aprovador.
  const status: WorkItemStatus = !owner ? "inbox" : opt.fields.kind === "approval" ? "awaiting_approval" : "planned";
  if (status === "awaiting_approval" && opt.fields.approver_id === owner) return fail(fd, { error: "invalid", field: "approver_id" });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_item")
    .insert({ ...opt.fields, title, owner_id: owner, due_at: due, status, created_by: a.id, updated_by: a.id } as never)
    .select("id")
    .single();
  if (error || !data) return fail(fd, { error: dbError(error) });
  revalidateWork(data.id);
  return { ok: true, id: data.id };
}

export async function updateWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  if (!a.overseer) return fail(fd, { error: "forbidden" });
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const title = str(fd, "title", 200);
  if (title.length < 2) return fail(fd, { error: "invalid", field: "title" });
  const owner = uuidOrNull(str(fd, "owner_id"));
  if (!owner) return fail(fd, { error: "invalid", field: "owner_id" });
  const dueRaw = str(fd, "due_at", 16);
  const due_at = dueRaw ? (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dueRaw) ? new Date(`${dueRaw}:00-03:00`).toISOString() : undefined) : null;
  if (due_at === undefined) return fail(fd, { error: "invalid", field: "due_at" });
  const opt = readOptional(fd);
  if (isState(opt)) return fail(fd, opt);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_item")
    .update({ ...opt.fields, title, owner_id: owner, due_at, updated_by: a.id } as never)
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidateWork(id);
  return { ok: true };
}

export async function transitionWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  const to = str(fd, "to") as WorkItemStatus;
  if (!id || !Number.isInteger(version) || !WORK_ITEM_STATUSES.includes(to)) return fail(fd, { error: "invalid" });
  const item = await getWorkItem(id);
  if (!item) return fail(fd, { error: "not_found" });
  const label = str(fd, "label");
  if (!availableTransitions(item, a).some((t) => t.to === to && (!label || t.label === label))) return fail(fd, { error: "forbidden" });

  const note = str(fd, "note", 1000);
  const patch: Record<string, unknown> = { status: to, status_note: note, updated_by: a.id };
  if (label === "requestChanges" && !note) return fail(fd, { error: "invalid", field: "note" });
  if (to === "waiting") {
    const party = str(fd, "waiting_on") as WaitingParty;
    if (!WAITING_PARTIES.includes(party)) return fail(fd, { error: "invalid", field: "waiting_on" });
    patch.waiting_on = party;
    patch.waiting_note = str(fd, "waiting_note", 300);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("work_item").update(patch as never).eq("id", id).eq("version", version).eq("status", item.status).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidateWork(id);
  return { ok: true };
}

export async function decideWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  // Opção escolhida, ou "Outra" com o texto livre.
  const choice = str(fd, "choice", 200);
  const outcome = choice && choice !== "__other__" ? choice : str(fd, "outcome", 1000);
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  if (!outcome) return fail(fd, { error: "invalid", field: "outcome" });
  const item = await getWorkItem(id);
  if (!item) return fail(fd, { error: "not_found" });
  if (!canDecide(item, a)) return fail(fd, { error: "forbidden" });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_item")
    .update({ decision_outcome: outcome, status: "done", updated_by: a.id })
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidateWork(id);
  return { ok: true };
}

export async function commentWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  const body = str(fd, "body", 4000);
  if (!id) return fail(fd, { error: "invalid" });
  if (!body) return fail(fd, { error: "invalid", field: "body" });
  // menções: só quem já participa da ação (o banco confere)
  const mentions = [...new Set(fd.getAll("mentions").map(String).filter((m) => /^[0-9a-f-]{36}$/.test(m) && m !== a.id))].slice(0, 10);
  const supabase = await createClient();
  const { error } = await supabase.from("work_item_comment").insert({ item_id: id, author_id: a.id, body, mentions });
  if (error) return fail(fd, { error: dbError(error) });
  after(dispatchQuietly); // menção vira e-mail
  revalidatePath(`/portal/acoes/${id}`);
  return { ok: true };
}

export async function linkWorkItemFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  const fileId = uuidOrNull(str(fd, "file_id"));
  const op = str(fd, "op") || "link";
  if (!id) return fail(fd, { error: "invalid" });
  if (!fileId) return fail(fd, { error: "invalid", field: "file_id" });
  const supabase = await createClient();
  const { error } =
    op === "unlink"
      ? await supabase.from("work_item_file").delete().eq("item_id", id).eq("file_id", fileId)
      : await supabase.from("work_item_file").insert({ item_id: id, file_id: fileId, linked_by: a.id });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath(`/portal/acoes/${id}`);
  return { ok: true };
}

/** Entrada → planejada: quem responde e até quando (triagem). */
export async function acceptWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  if (!a.overseer) return fail(fd, { error: "forbidden" });
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const owner = uuidOrNull(str(fd, "owner_id"));
  if (!owner) return fail(fd, { error: "invalid", field: "owner_id" });
  const due = resolveDue(str(fd, "when") || "none", str(fd, "due_date", 10), "");
  if (due === undefined) return fail(fd, { error: "invalid", field: "due_date" });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_item")
    .update({ owner_id: owner, due_at: due, status: "planned", snoozed_until: null, updated_by: a.id })
    .eq("id", id)
    .eq("version", version)
    .eq("status", "inbox")
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidateWork(id);
  return { ok: true };
}

/** Lembrar depois: some das listas até a data escolhida (ou volta agora, com "clear"). */
export async function snoozeWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  if (!id) return fail(fd, { error: "invalid" });
  const item = await getWorkItem(id);
  if (!item) return fail(fd, { error: "not_found" });
  if (!isOpen(item.status) || !(a.overseer || item.owner_id === a.id)) return fail(fd, { error: "forbidden" });
  const preset = str(fd, "until");
  const until = preset === "clear" ? null : resolveSnooze(preset, str(fd, "snooze_date", 10));
  if (until === undefined) return fail(fd, { error: "invalid", field: "snooze_date" });

  const supabase = await createClient();
  const { error } = await supabase.from("work_item").update({ snoozed_until: until, updated_by: a.id }).eq("id", id);
  if (error) return fail(fd, { error: dbError(error) });
  revalidateWork(id);
  return { ok: true };
}

/** Checklist da ação: adicionar, marcar/desmarcar e remover (responsável ou administração/coordenação; o banco confere). */
export async function checklistWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (!id || !["add", "toggle", "remove"].includes(op)) return fail(fd, { error: "invalid" });
  const supabase = await createClient();
  let error: { code?: string; message: string } | null = null;
  if (op === "add") {
    const label = str(fd, "label", 300);
    if (!label) return fail(fd, { error: "invalid", field: "label" });
    const { count } = await supabase.from("work_item_checklist_item").select("id", { count: "exact", head: true }).eq("item_id", id);
    ({ error } = await supabase.from("work_item_checklist_item").insert({ item_id: id, label, position: (count ?? 0) + 1, created_by: a.id }));
  } else {
    const entry = str(fd, "entry_id");
    if (!/^[0-9a-f-]{36}$/.test(entry)) return fail(fd, { error: "invalid" });
    if (op === "toggle") {
      const { data, error: e } = await supabase.from("work_item_checklist_item").update({ done: fd.get("done") === "true" }).eq("id", entry).eq("item_id", id).select("id");
      error = e;
      if (!e && !data?.length) return fail(fd, { error: "forbidden" });
    } else {
      ({ error } = await supabase.from("work_item_checklist_item").delete().eq("id", entry).eq("item_id", id));
    }
  }
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath(`/portal/acoes/${id}`);
  return { ok: true };
}

/** Processo a partir de um modelo: cria processo, ações e passos numa transação (função do banco). */
export async function createWorkProcess(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  if (!a.overseer) return fail(fd, { error: "forbidden" });
  const template = findTemplate(str(fd, "template"));
  if (!template) return fail(fd, { error: "invalid" });
  const title = str(fd, "title", 200);
  if (title.length < 2) return fail(fd, { error: "invalid", field: "title" });
  const eventDate = str(fd, "event_date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return fail(fd, { error: "invalid", field: "event_date" });
  const owner = uuidOrNull(str(fd, "owner_id"));
  if (!owner) return fail(fd, { error: "invalid", field: "owner_id" });
  const approver = uuidOrNull(str(fd, "approver_id"));
  const needsApprover = template.phases.some((p) => p.items.some((i) => i.approval));
  if (needsApprover && (!approver || approver === owner)) return fail(fd, { error: "invalid", field: "approver_id" });

  const items = buildProcessItems(template, { eventDate, approverId: approver });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_work_process", {
    p_process: { template: template.key, title, event_date: eventDate, owner_id: owner, project_id: str(fd, "project_id"), organization_id: str(fd, "organization_id") },
    p_items: items as unknown as Json,
  });
  if (error || !data) return fail(fd, { error: dbError(error) });
  revalidateWork();
  redirect(`/portal/acoes/processos/${data}`);
}

