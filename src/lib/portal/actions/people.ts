"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, type ActionState } from "../action-state";
import { canChangePrivileges, type GlobalRole } from "../authz";

const ROLES: GlobalRole[] = ["admin", "coordination", "advisor", "member", "external", "viewer"];
const STATUSES = ["pending", "active", "disabled"] as const;

/**
 * Ciclo de acesso (11/AUTH-003): admin ativa/desativa contas e atribui papel
 * global. O trigger guard_profile_privileges reforça (só admin; último admin
 * não sai) e audita cada mudança. Convite/aceite ficam para o provisionamento
 * via Supabase Auth (fora deste passo).
 */
export async function setProfileAccess(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const version = Number(fd.get("version"));
  const role = String(fd.get("global_role") ?? "") as GlobalRole;
  const status = String(fd.get("status") ?? "") as (typeof STATUSES)[number];
  if (!id || !Number.isInteger(version) || !ROLES.includes(role) || !STATUSES.includes(status)) return { error: "invalid" };
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return { error: "unauthenticated" };
  if (!canChangePrivileges(session.profile.global_role)) return { error: "forbidden" };

  const supabase = await createClient();
  const { data, error } = await supabase.from("profile").update({ global_role: role, status }).eq("id", id).eq("version", version).select("id");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "conflict" };
  revalidatePath("/portal/pessoas");
  return { ok: true };
}
