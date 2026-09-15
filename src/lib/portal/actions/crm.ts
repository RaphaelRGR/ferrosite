"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "../action-state";
import { isOverseer } from "../authz";
import { ACTIVITY_KINDS, CHALLENGE_STATUSES, CHALLENGE_TRANSITIONS, ORGANIZATION_KINDS, PARTNERSHIP_STAGES, type ActivityKind, type ChallengeStatus, type OrganizationKind, type PartnershipStage } from "../crm";

/**
 * Server Actions do CRM (13): organizações, contatos, interações, pipeline e
 * triagem de desafios. Overseers apenas (orientador atribuído só atualiza o
 * desafio dele — RLS). Concorrência por versão nas entidades versionadas.
 */
async function overseer(): Promise<{ userId: string; role: "admin" | "coordination" | "advisor" } | ActionState> {
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return { error: "unauthenticated" };
  const role = session.profile.global_role;
  if (role !== "admin" && role !== "coordination" && role !== "advisor") return { error: "forbidden" };
  return { userId: session.user.id, role };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 4000) => String(fd.get(key) ?? "").trim().slice(0, max);
const dateTimeOrNull = (v: string) => (v && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v) ? (v.length === 10 ? `${v}T12:00:00-03:00` : `${v}:00-03:00`) : null);

function readOrganization(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const name = str(fd, "name", 200);
  if (name.length < 2) return { error: "invalid", field: "name" };
  const kind = str(fd, "kind") as OrganizationKind;
  if (!ORGANIZATION_KINDS.includes(kind)) return { error: "invalid", field: "kind" };
  const website = str(fd, "website", 300);
  if (website && !/^https?:\/\//.test(website)) return { error: "invalid", field: "website" };
  return { fields: { name, kind, sector: str(fd, "sector", 120), city: str(fd, "city", 120), state: str(fd, "state", 2).toUpperCase(), country: str(fd, "country", 2).toUpperCase() || "BR", website, notes: str(fd, "notes", 4000) } };
}

export async function createOrganization(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  if (!isOverseer(a.role)) return fail(fd, { error: "forbidden" });
  const parsed = readOrganization(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("organization").insert({ ...parsed.fields, created_by: a.userId, updated_by: a.userId, owner_id: a.userId } as never).select("id").single();
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath("/portal/empresas");
  redirect(`/portal/empresas/${data.id}`);
}

export async function updateOrganization(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  if (!id || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  if (!isOverseer(a.role)) return fail(fd, { error: "forbidden" });
  const parsed = readOrganization(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const publicPartner = fd.get("public_partner") === "on";
  const brand = str(fd, "brand_authorized_at", 10);
  if (publicPartner && !/^\d{4}-\d{2}-\d{2}$/.test(brand)) return fail(fd, { error: "invalid", field: "brand_authorized_at" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization")
    .update({ ...parsed.fields, public_partner: publicPartner, brand_authorized_at: publicPartner ? `${brand}T12:00:00-03:00` : null, updated_by: a.userId } as never)
    .eq("id", id)
    .eq("version", version)
    .select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/empresas/${id}`);
  return { ok: true };
}

export async function moveOrganizationStage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  const stage = str(fd, "stage") as PartnershipStage;
  const reason = str(fd, "stage_reason", 500);
  if (!id || !Number.isInteger(version) || !PARTNERSHIP_STAGES.includes(stage)) return fail(fd, { error: "invalid" });
  if ((stage === "lost" || stage === "paused") && !reason) return fail(fd, { error: "invalid", field: "stage_reason" });
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  if (!isOverseer(a.role)) return fail(fd, { error: "forbidden" });
  const supabase = await createClient();
  const { data, error } = await supabase.from("organization").update({ stage, stage_reason: reason, updated_by: a.userId }).eq("id", id).eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/empresas/${id}`);
  revalidatePath("/portal/empresas");
  return { ok: true };
}

export async function addContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const organizationId = str(fd, "organization_id");
  const fullName = str(fd, "full_name", 160);
  const email = str(fd, "email", 254).toLowerCase();
  if (!organizationId || fullName.length < 2) return fail(fd, { error: "invalid", field: "full_name" });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(fd, { error: "invalid", field: "email" });
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  if (!isOverseer(a.role)) return fail(fd, { error: "forbidden" });
  const supabase = await createClient();
  const { error } = await supabase.from("contact").insert({ organization_id: organizationId, full_name: fullName, role_title: str(fd, "role_title", 120), email, phone: str(fd, "phone", 30), consent_note: str(fd, "consent_note", 500), created_by: a.userId });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath(`/portal/empresas/${organizationId}`);
  return { ok: true };
}

export async function addActivity(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const organizationId = str(fd, "organization_id");
  const kind = str(fd, "kind") as ActivityKind;
  const summary = str(fd, "summary", 4000);
  if (!organizationId || !ACTIVITY_KINDS.includes(kind)) return fail(fd, { error: "invalid", field: "kind" });
  if (!summary) return fail(fd, { error: "invalid", field: "summary" });
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  if (!isOverseer(a.role)) return fail(fd, { error: "forbidden" });
  const contactId = str(fd, "contact_id") || null;
  const supabase = await createClient();
  const { error } = await supabase.from("relationship_activity").insert({
    organization_id: organizationId,
    contact_id: contactId,
    kind,
    summary,
    occurred_at: dateTimeOrNull(str(fd, "occurred_at", 16)) ?? new Date().toISOString(),
    next_action: str(fd, "next_action", 500),
    next_action_at: dateTimeOrNull(str(fd, "next_action_at", 16)),
    created_by: a.userId,
  });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath(`/portal/empresas/${organizationId}`);
  return { ok: true };
}

export async function triageChallenge(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const version = Number(fd.get("version"));
  const from = str(fd, "from") as ChallengeStatus;
  const to = (str(fd, "status") || from) as ChallengeStatus;
  if (!id || !Number.isInteger(version) || !CHALLENGE_STATUSES.includes(from) || !CHALLENGE_STATUSES.includes(to)) return fail(fd, { error: "invalid" });
  if (to !== from && !CHALLENGE_TRANSITIONS[from].includes(to)) return fail(fd, { error: "invalid", field: "status" });
  const a = await overseer();
  if (isState(a)) return fail(fd, a);
  const patch: Record<string, unknown> = { status: to, triage_notes: str(fd, "triage_notes", 4000), updated_by: a.userId };
  // Só overseers atribuem e vinculam organização; orientador atribuído só muda situação/notas.
  if (isOverseer(a.role)) {
    patch.assigned_to = str(fd, "assigned_to") || null;
    patch.organization_id = str(fd, "organization_id") || null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("research_challenge").update(patch as never).eq("id", id).eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath(`/portal/desafios/${id}`);
  revalidatePath("/portal/desafios");
  return { ok: true };
}
