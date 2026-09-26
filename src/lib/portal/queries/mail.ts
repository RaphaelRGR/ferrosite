import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type MailStatus = Enums<"mail_status">;
export interface MailSummary {
  status: MailStatus;
  total: number;
  lastAt: string | null;
}

/** Resumo da caixa de saída (30 dias) — a função só devolve linhas para admin. */
export async function getMailSummary(): Promise<MailSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mail_outbox_summary");
  return (data ?? []).map((r) => ({ status: r.status, total: Number(r.total), lastAt: r.last_at ?? null }));
}
