import type { Metadata } from "next";
import Link from "next/link";
import { DriveIntegrationCard } from "@/components/portal/files/DriveIntegration";
import { getDictionary } from "@/i18n/dictionaries";
import { isServiceAccountConfigured } from "@/lib/files/drive";
import { getDriveStatus } from "@/lib/files/drive-connection";
import { driveErrorMessage } from "@/lib/files/drive-errors";
import { missingGoogleOAuthVars } from "@/lib/files/google-oauth";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";

export const metadata: Metadata = { title: "Integrações" };

/**
 * Configurações → Integrações (DRIVE-002): só admin/coordenação (a função do
 * banco também nega a quem não é). A identidade continua no Supabase; aqui só
 * se autoriza o Google Drive institucional.
 */
export default async function IntegrationsPage({ searchParams }: PageProps<"/portal/configuracoes/integracoes">) {
  const dict = getDictionary("pt");
  const { profile } = await requireActiveProfile();
  const d = dict.portal.integrations;
  const canManage = isOverseer(profile.global_role);
  const status = canManage ? await getDriveStatus() : null;
  const missingVars = missingGoogleOAuthVars();
  const code = String((await searchParams).drive ?? "");
  const notice = !code ? null : code === "connected" ? { tone: "success" as const, text: d.drive.noticeConnected } : { tone: "danger" as const, text: code === "persist" ? dict.portal.errors.server : driveErrorMessage(code) };

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/configuracoes" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.portal.settings.title}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{d.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">{d.help}</p>
      </header>
      {canManage ? (
        <DriveIntegrationCard dict={dict.portal} status={status} oauthConfigured={missingVars.length === 0} missingVars={missingVars} serviceAccount={isServiceAccountConfigured()} notice={notice} />
      ) : (
        <p role="status" className="rounded-xl border border-line bg-surface p-6 text-sm text-fg-muted">{d.forbidden}</p>
      )}
    </div>
  );
}
