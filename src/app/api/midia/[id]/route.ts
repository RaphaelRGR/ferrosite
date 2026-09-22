import { NextResponse } from "next/server";
import { MEDIA_WIDTHS } from "@/lib/content/media";
import { getDriveClient } from "@/lib/files/drive-connection";
import { proxyDriveFile, proxyDriveThumbnail } from "@/lib/files/proxy";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CACHE = "public, max-age=300, stale-while-revalidate=600";

/**
 * Mídia pública (DRIVE-001, 17): só a capa ou a galeria de uma publicação viva,
 * de arquivo verificado, público, com consentimento e de tipo de galeria —
 * decidido pela função `public_file_info` (service role). Fora disso, 404 sem
 * distinguir o motivo. Cache público curto: despublicar/revogar some em minutos.
 *
 * `?w=<largura>` (22): entrega a miniatura do Drive nessa largura em vez do
 * original — listas e galerias nunca baixam o arquivo inteiro. A largura vem de
 * uma lista fixa para não virar um gerador aberto de variações.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/midia/[id]">) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const raw = new URL(req.url).searchParams.get("w");
  const width = raw ? Number(raw) : 0;
  if (raw && !(MEDIA_WIDTHS as readonly number[]).includes(width)) return new NextResponse(null, { status: 400 });
  const drive = (await getDriveClient())?.client ?? null;
  const admin = createAdminClient();
  if (!drive || !admin) return new NextResponse(null, { status: 404 });
  const { data } = await admin.rpc("public_file_info", { p_file: id });
  const file = data?.[0];
  if (!file) return new NextResponse(null, { status: 404 });
  if (width) return proxyDriveThumbnail(drive, file.external_id, width, CACHE);
  return proxyDriveFile(drive, file, { range: req.headers.get("range"), disposition: "inline", cache: CACHE });
}
