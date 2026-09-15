import { logEvent } from "@/lib/observability/log";

/**
 * Hooks de instrumentação do Next (OPS-001): erros de servidor viram uma linha
 * JSON estruturada com rota, método e digest — sem corpo, cabeçalhos ou cookies.
 */
export async function register(): Promise<void> {
  logEvent("info", "app.start", { runtime: process.env.NEXT_RUNTIME, node: process.version, env: process.env.NODE_ENV });
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
