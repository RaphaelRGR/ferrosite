import { logEvent } from "@/lib/observability/log";

/**
 * Hooks de instrumentação do Next (OPS-001): erros de servidor viram uma linha
 * JSON estruturada com rota, método e digest — sem corpo, cabeçalhos ou cookies.
 */
export async function register(): Promise<void> {
  // Versão do Node só no runtime nodejs; via globalThis para o bundle Edge não acusar `process.version`
  // (o aviso "Ecmascript file had an error" enchia o terminal do dev a cada compilação).
  const node = process.env.NEXT_RUNTIME === "nodejs" ? (globalThis as { process?: { versions?: { node?: string } } }).process?.versions?.node : undefined;
  logEvent("info", "app.start", { runtime: process.env.NEXT_RUNTIME, node, env: process.env.NODE_ENV });
}

export const onRequestError = async (
  error: { digest?: string; message?: string; name?: string },
  request: { path: string; method: string; headers: { [key: string]: string | string[] | undefined } },
  context: { routerKind: string; routePath: string; routeType: string; renderSource?: string; revalidateReason?: string },
): Promise<void> => {
  const rid = request.headers["x-request-id"] ?? request.headers["x-vercel-id"];
  logEvent("error", "request.error", {
    requestId: Array.isArray(rid) ? rid[0] : rid,
    route: context.routePath,
    method: request.method,
    routeType: context.routeType,
    renderSource: context.renderSource,
    digest: error.digest,
    name: error.name,
    message: error.message,
  });
};
