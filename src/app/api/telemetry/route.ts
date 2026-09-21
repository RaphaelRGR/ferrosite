import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { allowClientReport, isBodyTooLarge, parseClientReport } from "@/lib/observability/client-report";
import { correlationId, logEvent } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

/**
 * Relato de erro do navegador (OPS-002): corpo pequeno e validado, limite por
 * origem (hash, nunca IP em claro), vira `client.error` no log estruturado e,
 * quando houver sink configurado, segue para ele. Sempre 204 (nada a ecoar).
 */
export async function POST(req: Request) {
  const text = await req.text().catch(() => "");
  if (!text || isBodyTooLarge(text)) return new NextResponse(null, { status: 400 });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const report = parseClientReport(raw);
  if (!report) return new NextResponse(null, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const origin = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  if (!allowClientReport(origin)) return new NextResponse(null, { status: 429 });
  logEvent("error", "client.error", { requestId: correlationId(req.headers), ...report, origin });
  return new NextResponse(null, { status: 204 });
}
