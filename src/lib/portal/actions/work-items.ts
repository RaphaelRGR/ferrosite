"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { isOverseer } from "@/lib/portal/authz";
import { getWorkItem } from "@/lib/portal/queries/work-items";
import {
  availableTransitions, canDecide, resolveDue, WAITING_PARTIES, WORK_ITEM_KINDS, WORK_ITEM_PRIORITIES, WORK_ITEM_STATUSES,
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
  return {
    fields: {
      kind,
      priority,
      description: str(fd, "description", 4000),
      approver_id: approver,
      project_id: uuidOrNull(str(fd, "project_id")),
      organization_id: uuidOrNull(str(fd, "organization_id")),
    },
  };
}

export async function createWorkItem(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await actor();
  if (isState(a)) return fail(fd, a);
  if (!a.overseer) return fail(fd, { error: "forbidden" });
  const title = str(fd, "title", 200);
  if (title.length < 2) return fail(fd, { error: "invalid", field: "title" });
  const owner = uuidOrNull(str(fd, "owner_id"));
  if (!owner) return fail(fd, { error: "invalid", field: "owner_id" });
  const due = resolveDue(str(fd, "when") || "none", str(fd, "due_date", 10), str(fd, "due_time", 5));
  if (due === undefined) return fail(fd, { error: "invalid", field: "due_date" });
  const opt = readOptional(fd);
  if (isState(opt)) return fail(fd, opt);
  // Pedido de aprovação já na criação: o tipo "aprovação" nasce aguardando o aprovador.
  const status: WorkItemStatus = opt.fields.kind === "approval" ? "awaiting_approval" : "planned";
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
  const outcome = str(fd, "outcome", 1000);
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
  const supabase = await createClient();
  const { error } = await supabase.from("work_item_comment").insert({ item_id: id, author_id: a.id, body });
  if (error) return fail(fd, { error: dbError(error) });
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
