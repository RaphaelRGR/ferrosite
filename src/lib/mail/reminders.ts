import { logEvent } from "@/lib/observability/log";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Lembretes de prazo das ações (ACT-004): "vence em 24 h" e "atrasou", um por
 * prazo (o banco não repete). Chamado pelo cron de `/api/mail/dispatch`; sem
 * service role configurado, não faz nada.
 */
export async function enqueueWorkItemReminders(): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  const { data, error } = await admin.rpc("enqueue_work_item_reminders");
  if (error) {
    logEvent("error", "mail.reminders_failed", { message: error.message });
    return 0;
  }
  return data ?? 0;
}
