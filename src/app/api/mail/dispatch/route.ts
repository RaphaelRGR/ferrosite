import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { dispatchMailOutbox } from "@/lib/mail/dispatch";
import { isMailConfigured } from "@/lib/mail/provider";

export const dynamic = "force-dynamic";

/**
 * Entrega sob demanda da caixa de saída (MAIL-001): para um cron externo
 * reprocessar o que ficou em `queued` (falha transitória, instância caída antes
 * do `after`). Protegido por segredo compartilhado (`MAIL_DISPATCH_SECRET`);
 * sem segredo configurado a rota não existe (404) — nunca aberta por padrão.
 */
function authorized(req: Request): boolean {
  const secret = process.env.MAIL_DISPATCH_SECRET ?? "";
  if (!secret) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.MAIL_DISPATCH_SECRET) return new NextResponse(null, { status: 404 });
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const result = await dispatchMailOutbox(50);
  return NextResponse.json({ ...result, mailConfigured: isMailConfigured() }, { headers: { "Cache-Control": "no-store" } });
}
