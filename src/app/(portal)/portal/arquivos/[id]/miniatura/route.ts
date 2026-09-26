import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getDriveClient } from "@/lib/files/drive-connection";
import { proxyDriveThumbnail } from "@/lib/files/proxy";
import { getFile } from "@/lib/portal/queries/content";

export const dynamic = "force-dynamic";

/** Miniatura gerada pelo Drive, para quem pode ver o arquivo (RLS); cache só privado. */
export async function GET(_req: Request, ctx: RouteContext<"/portal/arquivos/[id]/miniatura">) {
  const { id } = await ctx.params;
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return new NextResponse(null, { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const file = await getFile(id);
  if (!file || file.provider !== "google_drive" || file.status === "revoked" || file.status === "archived") return new NextResponse(null, { status: 404 });
  const drive = (await getDriveClient())?.client ?? null;
  if (!drive) return new NextResponse(null, { status: 503 });
  return proxyDriveThumbnail(drive, file.external_id, 640, "private, max-age=300");
}
