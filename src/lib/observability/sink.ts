/**
 * Sink de erros/avisos (OPS-002, 21): encaminha eventos `error` (e `warn`, se
 * pedido) do log estruturado para um webhook HTTPS genérico — JSON por POST com
 * Bearer opcional. Serve para Better Stack, Axiom, Loki (endpoint próprio),
 * um coletor da UFSC ou qualquer HTTP que aceite JSON; nada de SDK de terceiros
 * (decisão de provedor continua institucional; o contrato é este arquivo).
 * Nunca bloqueia nem lança: falha vira contador; excesso vira `dropped`.
 * Nunca chama `logEvent` (evitaria laço); os eventos já chegam redigidos.
 */
export type SinkLevel = "warn" | "error";

export interface SinkEnv {
  url: string;
  token: string;
  minLevel: SinkLevel;
}

export interface SinkEvent {
  ts: string;
  level: string;
  event: string;
  [key: string]: unknown;
}

export interface SinkStats {
  sent: number;
  failed: number;
  dropped: number;
}

export interface ErrorSink {
  readonly configured: boolean;
  /** Fire-and-forget; devolve a promessa só para testes. */
  send(event: SinkEvent): Promise<void>;
  stats(): SinkStats;
}

const MAX_PER_MINUTE = 60;
const TIMEOUT_MS = 5_000;

export function readSinkEnv(env: NodeJS.ProcessEnv = process.env): SinkEnv | null {
  const url = env.ERROR_SINK_URL ?? "";
  if (!/^https:\/\/[^\s/]+/.test(url)) return null;
  return { url, token: env.ERROR_SINK_TOKEN ?? "", minLevel: env.ERROR_SINK_LEVEL === "warn" ? "warn" : "error" };
}

export function isErrorSinkConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return readSinkEnv(env) !== null;
}

export function shouldForward(level: string, minLevel: SinkLevel): boolean {
  return level === "error" || (level === "warn" && minLevel === "warn");
}

export function createWebhookSink(cfg: SinkEnv, fetchImpl: typeof fetch = fetch, now: () => number = Date.now): ErrorSink {
  const stats: SinkStats = { sent: 0, failed: 0, dropped: 0 };
  let windowStart = now();
  let inWindow = 0;
  const service = { service: "ferrosite", env: process.env.NODE_ENV ?? "development", version: process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev" };

  return {
    configured: true,
    async send(event) {
      if (!shouldForward(event.level, cfg.minLevel)) return;
      const t = now();
      if (t - windowStart >= 60_000) {
        windowStart = t;
        inWindow = 0;
      }
      if (inWindow >= MAX_PER_MINUTE) {
        stats.dropped += 1;
        return;
      }
      inWindow += 1;
      const body = JSON.stringify({ ...service, dropped: stats.dropped, events: [event] });
      try {
        const res = await fetchImpl(cfg.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}) },
          body,
          signal: AbortSignal.timeout(TIMEOUT_MS),
          keepalive: true,
        });
        if (res.ok) stats.sent += 1;
        else stats.failed += 1;
      } catch {
        stats.failed += 1;
      }
    },
    stats: () => ({ ...stats }),
  };
}

const NOOP: ErrorSink = { configured: false, send: async () => undefined, stats: () => ({ sent: 0, failed: 0, dropped: 0 }) };

let current: ErrorSink | null = null;
export function getErrorSink(): ErrorSink {
  if (current) return current;
  const cfg = readSinkEnv();
  current = cfg ? createWebhookSink(cfg) : NOOP;
  return current;
}

/** Só para testes: descarta a instância em cache. */
export function resetErrorSink(): void {
  current = null;
}
