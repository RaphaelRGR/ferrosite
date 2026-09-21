import { NextResponse } from "next/server";
import { CONSENT_STATUSES } from "@/lib/portal/content-constants";
import { CLASSIFICATIONS } from "@/lib/portal/authz";
import { parseTarget, uploadToDrive, type UploadError } from "@/lib/files/upload";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
/** Limite da requisição (o allowlist por tipo é mais restritivo; aqui é o teto da rede). */
const MAX_REQUEST_BYTES = 200 * 1024 * 1024;

const STATUS: Record<UploadError, number> = {
  unauthenticated: 401, forbidden: 403, not_found: 404, no_write_scope: 409, unconfigured: 503,
  unsupported_type: 415, extension_mismatch: 415, too_large: 413, empty: 400, invalid_target: 400,
  revoked: 409, api_disabled: 503, provider: 502, network: 502, trashed: 404, outside_root: 400, db: 500,
};

/**
 * `POST multipart/form-data` (DRIVE-003): campos `file`, `target` (project|area) e
 * metadados. Sessão + RLS decidem; resposta JSON só com id/caminho/nome — nunca
 * detalhes do provedor. Sem cache.
 */
export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_REQUEST_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "empty" }, { status: 400 });
  if (file.size > MAX_REQUEST_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const target = parseTarget(fd);
  if (!target) return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  const str = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const classification = str("classification", 20);
  const consent = str("consent", 20);
  if (!(CLASSIFICATIONS as readonly string[]).includes(classification) || !(CONSENT_STATUSES as readonly string[]).includes(consent)) return NextResponse.json({ error: "invalid_target" }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const r = await uploadToDrive({
    target,
    originalName: file.name,
    bytes,
    classification: classification as never,
    consent: consent as never,
    consentNote: str("consent_note", 500),
    credit: str("credit", 200),
    altText: str("alt_text", 300),
    altTextEn: str("alt_text_en", 300),
  });
  if (!r.ok) return NextResponse.json({ error: r.error, ...(r.error === "too_large" || r.error === "extension_mismatch" ? { detail: r.detail } : {}) }, { status: STATUS[r.error] ?? 500 });
  return NextResponse.json(r.result, { status: 201 });
}
