import { NextResponse } from "next/server";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentSession } from "@/lib/auth/session";
import { isOverseer } from "@/lib/portal/authz";
import { getSnapshot, reportToCsv, type IndicatorReport } from "@/lib/portal/reports";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Exportação CSV de um snapshot (19): mesma fórmula do painel (dados congelados),
 * permissão de overseer (RLS também), registro na auditoria, sem cache.
 */
export async function GET(_req: Request, ctx: RouteContext<"/portal/relatorios/[id]/export">) {
  const { id } = await ctx.params;
  const session = await getCurrentSession();
  if (!session?.profile || session.profile.status !== "active") return new NextResponse(null, { status: 401 });
  if (!isOverseer(session.profile.global_role)) return new NextResponse(null, { status: 403 });
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const snapshot = await getSnapshot(id);
  if (!snapshot) return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "report.export", p_target_type: "report_snapshot", p_target_id: id, p_result: "ok", p_diff: { format: "csv" } });

  const names = getDictionary("pt").portal.reports.names as Record<string, string>;
  const csv = reportToCsv(snapshot.data as unknown as IndicatorReport, names, snapshot.generated_at);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="indicadores-${snapshot.period_start}-${snapshot.period_end}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
