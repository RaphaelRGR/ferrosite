import { getCurrentSession, type CurrentProfile } from "@/lib/auth/session";
import { isOverseer } from "@/lib/portal/authz";

/**
 * Quem configura a integração institucional do Drive (DRIVE-002): sessão
 * Supabase ativa + admin/coordenação. Usado por rotas e ações — nunca só pela UI.
 */
export type DriveGuard = { ok: true; userId: string; profile: CurrentProfile } | { ok: false; reason: "unauthenticated" | "forbidden" };

export async function requireDriveManager(): Promise<DriveGuard> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { ok: false, reason: "unauthenticated" };
  if (!isOverseer(s.profile.global_role)) return { ok: false, reason: "forbidden" };
  return { ok: true, userId: s.user.id, profile: s.profile };
}
