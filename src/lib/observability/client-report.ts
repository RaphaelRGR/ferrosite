/**
 * Contrato do relato de erro vindo do navegador (OPS-002): campos fixos,
 * tamanhos limitados, nada além do que o error boundary já mostra no console.
 * Puro (sem I/O) para ser testado; a rota aplica limite por origem.
 */
export interface ClientReport {
  scope: "public" | "portal";
  name: string;
  message: string;
  digest: string;
  path: string;
}

const MAX_BODY_BYTES = 4 * 1024;

export function parseClientReport(raw: unknown): ClientReport | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const scope = r.scope === "portal" ? "portal" : r.scope === "public" ? "public" : null;
  if (!scope || typeof r.name !== "string" || typeof r.message !== "string") return null;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n\t]+/g, " ").slice(0, max) : "");
  const path = str(r.path, 300);
  if (path && !path.startsWith("/")) return null;
  return { scope, name: str(r.name, 100), message: str(r.message, 500), digest: str(r.digest, 64), path };
}

export function isBodyTooLarge(text: string): boolean {
  return Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES;
}

/** Limite simples por origem (memória do processo): 30 relatos por minuto. */
const buckets = new Map<string, { start: number; count: number }>();
export function allowClientReport(key: string, now = Date.now(), limit = 30): boolean {
  const b = buckets.get(key);
  if (!b || now - b.start >= 60_000) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 5000) buckets.clear();
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
