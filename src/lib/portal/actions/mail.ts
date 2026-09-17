"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { dispatchMailOutbox, type DispatchResult } from "@/lib/mail/dispatch";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "../action-state";

export interface DispatchState extends ActionState {
  result?: DispatchResult;
}

/** Entrega manual da fila (MAIL-001): só admin; auditada com o resumo (sem destinatários). */
export async function dispatchNow(): Promise<DispatchState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  if (s.profile.global_role !== "admin") return { error: "forbidden" };
  const result = await dispatchMailOutbox(50);
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "mail.dispatch", p_target_type: "mail_outbox", p_target_id: "batch", p_result: "ok", p_diff: { ...result } });
  revalidatePath("/portal/configuracoes");
  return { ok: true, result };
}
