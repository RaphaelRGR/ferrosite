import { getErrorSink } from "./sink";

/**
 * Log estruturado (OPS-001, 21): uma linha JSON por evento, com nível, evento,
 * instante, request/correlation id quando houver e campos — SEM segredos:
 * chaves sensíveis são redigidas antes de serializar e valores longos cortados.
 * O destino (stdout → coletor da plataforma) é decisão de operação; aqui só o formato.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE = /(token|secret|password|passwd|authorization|cookie|api[-_]?key|service[-_]?role|jwt|session)/i;
const MAX_STRING = 500;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (typeof value === "string") return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[${value.length}]` : value;
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Error) return { name: value.name, message: redact(value.message), stack: process.env.NODE_ENV === "production" ? undefined : value.stack?.split("\n").slice(0, 8).join("\n") };
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v, depth + 1);
  return out;
}

export interface LogFields {
  requestId?: string;
  route?: string;
  userId?: string;
  [key: string]: unknown;
}

export function logEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
  const record = { ts: new Date().toISOString(), level, event, ...(redact(fields) as object) };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  // OPS-002: erro/aviso também vai ao sink externo (quando configurado), já redigido; nunca bloqueia.
  if (level === "error" || level === "warn") void getErrorSink().send(record);
}

/** Id de correlação: usa o cabeçalho do provedor quando existir, senão gera um. */
export function correlationId(headers: { get(name: string): string | null }): string {
  return headers.get("x-request-id") || headers.get("x-vercel-id") || crypto.randomUUID();
}
