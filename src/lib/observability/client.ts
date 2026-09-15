"use client";

/**
 * Relato de erro no cliente (OPS-001): só nome, mensagem, digest e rota — sem
 * PII nem stack em produção. Vai para o console do navegador em formato
 * estruturado e, quando houver sink aprovado (decisão de operação), para
 * `/api/telemetry` via o mesmo objeto.
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
  console.error(JSON.stringify(payload));
}
