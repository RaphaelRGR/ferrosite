import type { RenderedMail } from "./templates";

/**
 * Provedor de envio (MAIL-001): Resend pela API HTTP com `fetch` — sem SDK
 * (uma chamada REST não justifica dependência). A interface é o contrato:
 * trocar de provedor é implementar `MailProvider` e escolher em `getMailProvider`.
 * Configuração ausente ⇒ `null` e a fila fica em `queued` (nada se perde).
 */
export interface MailProvider {
  readonly name: string;
  send(input: { to: string; mail: RenderedMail }): Promise<{ ok: true; id: string } | { ok: false; error: string; retryable: boolean }>;
}

export interface MailEnv {
  apiKey: string;
  from: string;
  replyTo: string;
}

export function readMailEnv(env: NodeJS.ProcessEnv = process.env): MailEnv | null {
  const apiKey = env.RESEND_API_KEY ?? "";
  const from = env.MAIL_FROM ?? "";
  if (!apiKey || !from) return null;
  return { apiKey, from, replyTo: env.MAIL_REPLY_TO ?? "" };
}

export function isMailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readMailEnv(env) !== null;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function createResendProvider(cfg: MailEnv, fetchImpl: typeof fetch = fetch): MailProvider {
  return {
    name: "resend",
    async send({ to, mail }) {
      const body: Record<string, unknown> = { from: cfg.from, to: [to], subject: mail.subject, text: mail.text, html: mail.html };
      if (cfg.replyTo) body.reply_to = cfg.replyTo;
      let res: Response;
      try {
        res = await fetchImpl(RESEND_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (e) {
        return { ok: false, error: `network: ${(e as Error).name}`, retryable: true };
      }
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { ok: true, id: typeof data.id === "string" ? data.id : "" };
      }
      // 4xx (chave inválida, remetente não verificado, destinatário rejeitado) não melhora repetindo; 429/5xx sim.
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      return { ok: false, error: `http ${res.status}: ${detail}`, retryable: res.status === 429 || res.status >= 500 };
    },
  };
}

export function getMailProvider(): MailProvider | null {
  const cfg = readMailEnv();
  return cfg ? createResendProvider(cfg) : null;
}
