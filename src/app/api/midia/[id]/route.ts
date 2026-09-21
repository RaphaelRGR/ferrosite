import { NextResponse } from "next/server";
import { getDriveClient } from "@/lib/files/drive";
import { proxyDriveFile } from "@/lib/files/proxy";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Mídia pública (DRIVE-001, 17): só a capa de uma publicação viva, de arquivo
 * verificado, público, com consentimento e de tipo de galeria — decidido pela
 * função `public_file_info` (service role). Fora disso, 404 sem distinguir o
 * motivo. Cache público curto: despublicar/revogar some em minutos.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/midia/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const drive = getDriveClient();
  const admin = createAdminClient();
  if (!drive || !admin) return new NextResponse(null, { status: 404 });
  const { data } = await admin.rpc("public_file_info", { p_file: id });
  const file = data?.[0];
  if (!file) return new NextResponse(null, { status: 404 });
  return proxyDriveFile(drive, file, { range: req.headers.get("range"), disposition: "inline", cache: "public, max-age=300, stale-while-revalidate=600" });
}
