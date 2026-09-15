import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { ChallengeStatus, PartnershipStage } from "./crm-constants";

export * from "./crm-constants";

/** Leitura do CRM no servidor (RLS: coordenação/administração; orientador só desafios atribuídos). */
export type OrganizationRow = Tables<"organization">;
export type ContactRow = Tables<"contact">;
export type ActivityRow = Tables<"relationship_activity"> & { contact: Pick<ContactRow, "full_name"> | null };
export type ChallengeRow = Tables<"research_challenge"> & { organization: Pick<OrganizationRow, "id" | "name"> | null; assignee: Pick<Tables<"profile">, "full_name" | "email"> | null };
export type CrmEventRow = Tables<"crm_event"> & { actor: Pick<Tables<"profile">, "full_name" | "email"> | null };
export async function listOrganizations(stage?: PartnershipStage | "all"): Promise<OrganizationRow[]> {
  const supabase = await createClient();
  let q = supabase.from("organization").select("*").is("archived_at", null).order("name");
  if (stage && stage !== "all") q = q.eq("stage", stage);
  const { data } = await q;
  return data ?? [];
}

export const getOrganization = cache(async (id: string): Promise<OrganizationRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("organization").select("*").eq("id", id).maybeSingle();
  return data;
});

export async function listContacts(organizationId: string): Promise<ContactRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("contact").select("*").eq("organization_id", organizationId).order("full_name");
  return data ?? [];
}

export async function listActivities(organizationId: string): Promise<ActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("relationship_activity")
    .select("*, contact:contact_id (full_name)")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false });
  return (data ?? []) as unknown as ActivityRow[];
}

export async function listChallenges(status?: ChallengeStatus | "all"): Promise<ChallengeRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("research_challenge")
    .select("*, organization:organization_id (id, name), assignee:assigned_to (full_name, email)")
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []) as unknown as ChallengeRow[];
}

export const getChallenge = cache(async (id: string): Promise<ChallengeRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("research_challenge")
    .select("*, organization:organization_id (id, name), assignee:assigned_to (full_name, email)")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as ChallengeRow | null) ?? null;
});

export async function listCrmEvents(filter: { organizationId?: string; challengeId?: string }, limit = 30): Promise<CrmEventRow[]> {
  const supabase = await createClient();
  let q = supabase.from("crm_event").select("*, actor:actor_id (full_name, email)").order("occurred_at", { ascending: false }).limit(limit);
  if (filter.organizationId) q = q.eq("organization_id", filter.organizationId);
  if (filter.challengeId) q = q.eq("challenge_id", filter.challengeId);
  const { data } = await q;
  return (data ?? []) as unknown as CrmEventRow[];
}

/** Perfis ativos que podem triar (overseers e orientadores) — só overseers chegam aqui (RLS profile_select). */
export async function listTriagers(): Promise<Array<{ id: string; label: string }>> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("id, full_name, email, global_role").eq("status", "active").in("global_role", ["admin", "coordination", "advisor"]).order("full_name");
  return (data ?? []).map((p) => ({ id: p.id, label: p.full_name || p.email }));
}
