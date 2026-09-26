import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getDriveClient } from "@/lib/files/drive-connection";
import { proxyDriveFile } from "@/lib/files/proxy";
import { getFile } from "@/lib/portal/queries/content";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Original do arquivo (DRIVE-001): sessão ativa + RLS (`getFile` só devolve o
 * que a pessoa pode ver) + auditoria `file.access`; bytes via proxy, sem cache.
 * Provedor não configurado ⇒ 503 (a UI já avisa). Revogado/arquivado ⇒ 404.
 */
export async function GET(req: Request, ctx: RouteContext<"/portal/arquivos/[id]/original">) {
  const { id } = await ctx.params;
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return new NextResponse(null, { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const file = await getFile(id);
  if (!file || file.provider !== "google_drive" || file.status === "revoked" || file.status === "archived") return new NextResponse(null, { status: 404 });
  const drive = (await getDriveClient())?.client ?? null;
  if (!drive) return new NextResponse(null, { status: 503 });
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "file.access", p_target_type: "file_asset", p_target_id: id, p_result: "ok", p_diff: { mode: "original" } });
  const download = new URL(req.url).searchParams.get("baixar") === "1";
  return proxyDriveFile(drive, file, { range: req.headers.get("range"), disposition: download ? "attachment" : "inline", cache: "private, no-store" });
}
