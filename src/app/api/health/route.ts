import { NextResponse } from "next/server";
import { isDriveAvailable } from "@/lib/files/drive-availability";
import { isMailConfigured } from "@/lib/mail/provider";
import { isErrorSinkConfigured } from "@/lib/observability/sink";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Health check (OPS-001): vivo/configurado, sem segredos, sem cache. Não toca o
 * banco (a checagem profunda é do provedor) para não virar vetor de carga.
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok", time: new Date().toISOString(), version: process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev", supabaseConfigured: isSupabaseConfigured(), mailConfigured: isMailConfigured(), driveConfigured: await isDriveAvailable(), errorSinkConfigured: isErrorSinkConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
