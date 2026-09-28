import { NextResponse } from "next/server";
import { logEvent } from "@/lib/observability/log";
import { MAX_PROXY_BYTES, type DriveClient } from "./drive";

/**
 * Proxy de bytes do Drive (DRIVE-001, 21): nunca redireciona para o provedor,
 * repassa só o corpo com o MIME registrado no banco (não o que o Drive diz),
 * `nosniff`, sem cookies, tamanho limitado, Range repassado para vídeo/PDF.
 */
const SAFE_NAME = /[^\w.\- ]+/g;

/**
 * Falha do provedor: nunca em cache (a foto volta assim que a conexão voltar) e
 * com o motivo no log (ex.: `revoked`, `unconfigured`), sem detalhes sensíveis.
 */
export function driveFailure(status: number, error?: unknown): Response {
  if (error !== undefined) {
    const code = error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : (error as Error)?.name ?? "unknown";
    logEvent("warn", "drive.proxy_failed", { status, code });
  }
  return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
}

export async function proxyDriveFile(
  drive: DriveClient,
  file: { external_id: string; mime_type: string; name: string; size_bytes: number | null },
  opts: { range?: string | null; disposition: "inline" | "attachment"; cache: string },
): Promise<Response> {
  if (file.size_bytes !== null && file.size_bytes > MAX_PROXY_BYTES) return new NextResponse(null, { status: 413 });
  let upstream: Response;
  try {
    upstream = await drive.download(file.external_id, opts.range);
  } catch (e) {
    return driveFailure(502, e);
  }
  if (upstream.status === 404 || upstream.status === 403) return driveFailure(404);
  if (!upstream.ok && upstream.status !== 206) return driveFailure(502, { code: `upstream_${upstream.status}` });
  const headers = new Headers({
    "Content-Type": file.mime_type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": opts.cache,
    "Content-Disposition": `${opts.disposition}; filename="${file.name.replace(SAFE_NAME, "_").slice(0, 120) || "arquivo"}"`,
    "Accept-Ranges": "bytes",
  });
  for (const h of ["Content-Length", "Content-Range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function proxyDriveThumbnail(drive: DriveClient, externalId: string, size: number, cache: string): Promise<Response> {
  let upstream: Response | null;
  try {
    upstream = await drive.thumbnail(externalId, size);
  } catch (e) {
    return driveFailure(502, e);
  }
  if (!upstream || !upstream.ok) return driveFailure(404);
  const type = upstream.headers.get("Content-Type") ?? "";
  if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return new NextResponse(null, { status: 404 });
  return new Response(upstream.body, { status: 200, headers: { "Content-Type": type, "X-Content-Type-Options": "nosniff", "Cache-Control": cache } });
}
