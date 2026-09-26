"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { isOverseer } from "@/lib/portal/authz";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Snapshot de indicadores (19): congela período + versão das fórmulas; a função audita. */
export async function createSnapshot(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const start = String(fd.get("start") ?? "");
  const end = String(fd.get("end") ?? "");
  if (!DATE.test(start) || !DATE.test(end) || end < start) return fail(fd, { error: "invalid", field: "end" });
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return fail(fd, { error: "unauthenticated" });
  if (!isOverseer(s.profile.global_role)) return fail(fd, { error: "forbidden" });
  const supabase = await createClient();
  const { error } = await supabase.rpc("snapshot_indicators", { p_start: start, p_end: end });
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath("/portal/relatorios");
  return { ok: true };
}
