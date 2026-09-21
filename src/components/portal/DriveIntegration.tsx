"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import type { DriveStatus } from "@/lib/files/drive-connection";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { disconnectDrive, setDriveFolder, testDriveConnection, type DriveTestState } from "@/lib/portal/actions/drive";
import { ActionFeedback, fieldError } from "./ActionFeedback";

type Dict = Dictionary["portal"];

const PANEL = "rounded-xl border border-line bg-surface p-6";
const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/**
 * Card "Google Drive" de Configurações → Integrações (DRIVE-002). Nunca vê
 * tokens: recebe só o estado da função `drive_integration_status`; as ações
 * revalidam a rota e o servidor decide (guard + service role).
 */
export function DriveIntegrationCard({ dict, status, oauthConfigured, missingVars, serviceAccount, notice }: {
  dict: Dict;
  status: DriveStatus | null;
  oauthConfigured: boolean;
  missingVars: string[];
  serviceAccount: boolean;
  /** Código vindo do callback (`?drive=`), já validado pela página. */
  notice: { tone: "success" | "danger"; text: string } | null;
}) {
  const d = dict.integrations.drive;
  const connected = status?.status === "connected";
  const revoked = status?.status === "revoked";
  return (
    <section className={PANEL} aria-labelledby="drive-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="drive-title" className="text-lg font-bold">{d.title}</h2>
        <Badge tone={connected ? "success" : revoked ? "danger" : "neutral"}>{connected ? d.connected : revoked ? d.revoked : d.notConnected}</Badge>
      </div>
      <p className="mt-1 text-sm text-fg-muted">{d.help}</p>

      {notice && (
        <p role={notice.tone === "danger" ? "alert" : "status"} className={`mt-4 rounded-lg border bg-surface px-4 py-3 text-sm font-bold ${notice.tone === "danger" ? "border-danger text-danger" : "border-success text-success"}`}>
          {notice.text}
        </p>
      )}

      {!oauthConfigured && (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-3 text-sm text-fg-muted">
          {d.unconfigured} <code className="break-all font-mono text-xs">{missingVars.join(", ")}</code>
        </p>
      )}

      {connected ? (
        <>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className={H2}>{d.account}</dt>
              <dd className="mt-1 break-all">{status.accountName ? `${status.accountName} · ` : ""}{status.accountEmail}</dd>
            </div>
            <div>
              <dt className={H2}>{d.rootFolder}</dt>
              <dd className="mt-1 break-all">{status.rootFolderName || (status.rootFolderId ? status.rootFolderId : d.noFolder)}</dd>
            </div>
            <div>
              <dt className={H2}>{d.scope}</dt>
              <dd className="mt-1 break-all font-mono text-xs">{status.scope || "—"}</dd>
            </div>
            <div>
              <dt className={H2}>{d.lastCheck}</dt>
              <dd className="mt-1">
                {status.lastCheckedAt ? formatDate("pt", new Date(status.lastCheckedAt), { dateStyle: "short", timeStyle: "short" }) : d.never}
                {status.lastError && <span className="block text-danger">{status.lastError}</span>}
              </dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TestForm dict={dict} />
            <FolderForm dict={dict} current={status.rootFolderId} />
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <DisconnectForm dict={dict} />
          </div>
        </>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {revoked && <p className="text-sm text-danger">{d.revokedHelp}{status?.lastError ? ` (${status.lastError})` : ""}</p>}
          {serviceAccount && <p className="text-sm text-fg-muted">{d.serviceAccountFallback}</p>}
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/api/auth/google/start" prefetch={false} aria-disabled={!oauthConfigured} className={oauthConfigured ? "" : "pointer-events-none opacity-50"}>
              {revoked ? d.reconnect : d.connect}
            </LinkButton>
            {revoked && <DisconnectForm dict={dict} compact />}
          </div>
          {serviceAccount && <TestForm dict={dict} />}
        </div>
      )}
    </section>
  );
}

function TestForm({ dict }: { dict: Dict }) {
  const d = dict.integrations.drive;
  const [state, formAction, pending] = useActionState(testDriveConnection, IDLE as DriveTestState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} title={d.testHelp}>
          {d.test}
        </Button>
        <span className="text-xs text-fg-muted">{d.testHelp}</span>
      </div>
      {state.ok && state.account ? (
        <div role="status" className="rounded-lg border border-success bg-surface px-4 py-3 text-sm">
          <p className="font-bold text-success">{d.testOk}</p>
          <dl className="mt-2 grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="text-fg-muted">{d.account}</dt>
            <dd className="break-all">{state.account}</dd>
            <dt className="text-fg-muted">{d.rootFolder}</dt>
            <dd>{state.folder || d.noFolder}</dd>
            <dt className="text-fg-muted">{d.itemsFound}</dt>
            <dd>{state.folder ? state.items?.length ?? 0 : "—"}</dd>
            <dt className="text-fg-muted">{d.lastCheck}</dt>
            <dd>{state.checkedAt ? formatDate("pt", new Date(state.checkedAt), { dateStyle: "short", timeStyle: "short" }) : "—"}</dd>
          </dl>
          {state.items && state.items.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line" aria-label={d.itemsFound}>
              {state.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate">
                    <span aria-hidden="true" className="mr-2">{it.isFolder ? "📁" : "📄"}</span>
                    {it.name}
                  </span>
                  <span className="shrink-0 text-xs text-fg-muted">{it.isFolder ? d.folder : it.mimeType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <ActionFeedback state={state} dict={dict} />
      )}
    </form>
  );
}

function FolderForm({ dict, current }: { dict: Dict; current: string }) {
  const d = dict.integrations.drive;
  const [state, formAction, pending] = useActionState(setDriveFolder, IDLE as ActionState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input label={d.folderInput} name="folder" defaultValue={state.values?.folder ?? current} help={d.folderHelp} error={fieldError(state, "folder", dict)} maxLength={512} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {d.changeFolder}
        </Button>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}

function DisconnectForm({ dict, compact = false }: { dict: Dict; compact?: boolean }) {
  const d = dict.integrations.drive;
  const [state, formAction, pending] = useActionState(disconnectDrive, IDLE as ActionState & { revokedAtGoogle?: boolean });
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="danger" loading={pending} title={d.disconnectHelp}>
          {d.disconnect}
        </Button>
        {!compact && <span className="text-xs text-fg-muted">{d.disconnectHelp}</span>}
      </div>
      {state.ok ? (
        <p role="status" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">{state.revokedAtGoogle ? d.disconnectedRevoked : d.disconnectedLocal}</p>
      ) : (
        <ActionFeedback state={state} dict={dict} />
      )}
    </form>
  );
}
