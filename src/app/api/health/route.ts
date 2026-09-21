import { NextResponse } from "next/server";
import { isDriveConfigured } from "@/lib/files/drive";
import { isMailConfigured } from "@/lib/mail/provider";
import { isErrorSinkConfigured } from "@/lib/observability/sink";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Health check (OPS-001): vivo/configurado, sem segredos, sem cache. Não toca o
 * banco (a checagem profunda é do provedor) para não virar vetor de carga.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok", time: new Date().toISOString(), version: process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev", supabaseConfigured: isSupabaseConfigured(), mailConfigured: isMailConfigured(), driveConfigured: isDriveConfigured(), errorSinkConfigured: isErrorSinkConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
