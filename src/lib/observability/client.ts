"use client";

/**
 * Relato de erro no cliente (OPS-001/002): só nome, mensagem, digest e rota —
 * sem PII nem stack. Vai para o console do navegador em formato estruturado e
 * para `/api/telemetry` (mesmo objeto; `keepalive` para sobreviver à navegação),
 * onde vira `client.error` no log do servidor e no sink configurado.
 */
export function reportClientError(scope: "public" | "portal", error: Error & { digest?: string }): void {
  const payload = {
    ts: new Date().toISOString(),
    level: "error",
    event: "client.error",
    scope,
    name: error.name,
    message: error.message.slice(0, 500),
    digest: error.digest,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
  };
  const body = JSON.stringify(payload);
  console.error(body);
  try {
    void fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "omit" }).catch(() => undefined);
  } catch {
    // sem rede/fetch: o console já registrou
  }
}
