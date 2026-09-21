"use server";

import { getCurrentSession } from "@/lib/auth/session";
import { logEvent } from "@/lib/observability/log";
import { getErrorSink, type SinkStats } from "@/lib/observability/sink";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "../action-state";

export interface SinkTestState extends ActionState {
  stats?: SinkStats;
  configured?: boolean;
}

/** Evento de teste para o sink (OPS-002): só admin; auditado; devolve os contadores do processo. */
export async function sendSinkTest(): Promise<SinkTestState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  if (s.profile.global_role !== "admin") return { error: "forbidden" };
  const sink = getErrorSink();
  logEvent("error", "sink.test", { userId: s.user.id, note: "evento de teste disparado pelo Portal" });
  await new Promise((r) => setTimeout(r, 300)); // dá tempo ao envio fire-and-forget refletir nos contadores
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "observability.test", p_target_type: "error_sink", p_target_id: "webhook", p_result: "ok", p_diff: { configured: sink.configured, ...sink.stats() } });
  return { ok: true, configured: sink.configured, stats: sink.stats() };
}
