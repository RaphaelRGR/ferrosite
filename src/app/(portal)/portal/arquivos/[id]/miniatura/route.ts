import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getDriveClient } from "@/lib/files/drive-connection";
import { MEDIA_WIDTHS } from "@/lib/content/media";
import { proxyDriveThumbnail } from "@/lib/files/proxy";
import { getFile } from "@/lib/portal/queries/content";

export const dynamic = "force-dynamic";

/** Miniatura gerada pelo Drive, para quem pode ver o arquivo (RLS); cache só privado. */
export async function GET(req: Request, ctx: RouteContext<"/portal/arquivos/[id]/miniatura">) {
  const { id } = await ctx.params;
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return new NextResponse(null, { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const file = await getFile(id);
  if (!file || file.provider !== "google_drive" || file.status === "revoked" || file.status === "archived") return new NextResponse(null, { status: 404 });
  const drive = (await getDriveClient())?.client ?? null;
  if (!drive) return new NextResponse(null, { status: 503 });
  // EXP-001: grades pedem miniatura menor (`?w=`, mesma lista do site); o conteúdo de um arquivo não muda,
  // então o navegador guarda por um dia (privado: nunca em cache compartilhado).
  const asked = Number(new URL(req.url).searchParams.get("w"));
  const width = (MEDIA_WIDTHS as readonly number[]).includes(asked) ? asked : 640;
  return proxyDriveThumbnail(drive, file.external_id, width, "private, max-age=86400");
}
