"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { canChangePrivileges, type GlobalRole } from "@/lib/portal/authz";

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
  if (!id || !Number.isInteger(version) || !ROLES.includes(role) || !STATUSES.includes(status)) return fail(fd, { error: "invalid" });
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return fail(fd, { error: "unauthenticated" });
  if (!canChangePrivileges(session.profile.global_role)) return fail(fd, { error: "forbidden" });

  const supabase = await createClient();
  const { data, error } = await supabase.from("profile").update({ global_role: role, status }).eq("id", id).eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidatePath("/portal/pessoas");
  return { ok: true };
}

/**
 * Excluir conta (ACC-001). O banco decide e audita (erase_profile: só admin, conta desativada, nunca a
 * própria; remove o perfil ou o anonimiza se houver histórico). Depois o login é apagado no Supabase Auth
 * com a service role, que só existe no servidor. A confirmação exige digitar o e-mail da conta.
 */
export async function eraseProfileAccount(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("id") ?? "");
  const typed = String(fd.get("confirm_email") ?? "").trim().toLowerCase();
  if (!id) return fail(fd, { error: "invalid" });
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return fail(fd, { error: "unauthenticated" });
  if (!canChangePrivileges(session.profile.global_role)) return fail(fd, { error: "forbidden" });

  const supabase = await createClient();
  const { data: target } = await supabase.from("profile").select("email").eq("id", id).maybeSingle();
  if (target && target.email.toLowerCase() !== typed) return fail(fd, { error: "db:o e-mail digitado não confere com o da conta" });

  const { error } = await supabase.rpc("erase_profile", { p_target: id });
  if (error) return fail(fd, { error: dbError(error) });

  const admin = createAdminClient();
  if (!admin) return fail(fd, { error: "db:perfil excluído, mas o login não pôde ser apagado agora (sem service role); tente de novo" });
  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError && !/not found/i.test(authError.message)) return fail(fd, { error: `db:perfil excluído, mas o login não foi apagado (${authError.message}); tente de novo` });

  revalidatePath("/portal/pessoas");
  return { ok: true };
}
