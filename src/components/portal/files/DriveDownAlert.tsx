import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { DriveStatus } from "@/lib/files/drive-connection";

/**
 * Aviso na Minha mesa (EXP-001): sem a conexão com o Drive, as fotos do site
 * somem para o público. Antes disso ficava calado até alguém notar a Home vazia.
 */
export function DriveDownAlert({ status, dict }: { status: DriveStatus | null; dict: Dictionary["portal"] }) {
  if (status?.status === "connected" && !status.lastError) return null;
  const a = dict.driveAlert;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger bg-surface px-5 py-4">
      <div className="min-w-0">
        <p className="font-bold text-danger">{a.title}</p>
        <p className="mt-1 text-sm text-fg-muted">{status?.lastError ? `${a.body} ${a.reason}: ${status.lastError}` : a.body}</p>
      </div>
      <Link
        href="/portal/configuracoes/integracoes"
        className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-bold text-fg-on-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {a.action}
      </Link>
    </div>
  );
}
