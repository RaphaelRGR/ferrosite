import { logEvent } from "@/lib/observability/log";
import { SITE_URL } from "@/i18n/metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMailProvider, type MailProvider } from "./provider";
import { renderMail } from "./templates";

/**
 * Entrega da caixa de saída (MAIL-001): reserva um lote no banco (service role,
 * SKIP LOCKED), renderiza cada template e envia pelo provedor; baixa como
 * enviado, re-enfileira (erro transitório) ou falha (erro definitivo/limite).
 * Corre depois da resposta (`after`) nas ações que enfileiram e sob demanda em
 * `/api/mail/dispatch` (cron) — nunca bloqueia a resposta ao usuário. Logs sem
 * destinatário nem corpo: só ids, template e resultado.
 */
export interface DispatchResult {
  configured: boolean;
  claimed: number;
  sent: number;
  failed: number;
  requeued: number;
}

export async function dispatchMailOutbox(limit = 20, provider: MailProvider | null = getMailProvider()): Promise<DispatchResult> {
  const result: DispatchResult = { configured: provider !== null, claimed: 0, sent: 0, failed: 0, requeued: 0 };
  if (!provider) return result;
  const admin = createAdminClient();
  if (!admin) return { ...result, configured: false };

  const { data: batch, error } = await admin.rpc("claim_mail_outbox", { p_limit: limit });
  if (error) {
    logEvent("error", "mail.claim_failed", { message: error.message });
    return result;
  }
  const siteUrl = SITE_URL.origin;
  for (const row of batch ?? []) {
    result.claimed += 1;
    const mail = renderMail({ template: row.template, locale: row.locale, payload: row.payload, siteUrl });
    if (!mail) {
      await admin.rpc("settle_mail_outbox", { p_id: row.id, p_ok: false, p_detail: "template desconhecido ou payload incompleto", p_retry: false });
      result.failed += 1;
      logEvent("warn", "mail.render_failed", { id: row.id, template: row.template });
      continue;
    }
    const outcome = await provider.send({ to: row.recipient_email, mail });
    if (outcome.ok) {
      await admin.rpc("settle_mail_outbox", { p_id: row.id, p_ok: true, p_detail: outcome.id });
      result.sent += 1;
      logEvent("info", "mail.sent", { id: row.id, template: row.template, provider: provider.name });
    } else {
      await admin.rpc("settle_mail_outbox", { p_id: row.id, p_ok: false, p_detail: outcome.error, p_retry: outcome.retryable });
      if (outcome.retryable && row.attempts < 5) result.requeued += 1;
      else result.failed += 1;
      logEvent("warn", "mail.send_failed", { id: row.id, template: row.template, attempts: row.attempts, retryable: outcome.retryable, reason: outcome.error });
    }
  }
  return result;
}

/** Para `after()`: nunca propaga erro (a resposta já foi enviada). */
export async function dispatchQuietly(): Promise<void> {
  try {
    await dispatchMailOutbox();
  } catch (e) {
    logEvent("error", "mail.dispatch_crashed", { error: e });
  }
}
