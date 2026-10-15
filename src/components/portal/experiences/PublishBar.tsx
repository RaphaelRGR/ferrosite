"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { publishExperience, unpublishExperience } from "@/lib/portal/actions/experiences";
import type { SiteState } from "@/lib/portal/queries/experiences";

type Dict = Dictionary["portal"];

/** Situação no site + publicar/atualizar/tirar (publicação direta da administração/coordenação, EXP-001). */
export function PublishBar({ dict, itemId, site, publicHref, hasCover }: { dict: Dict; itemId: string; site: SiteState; publicHref: string; hasCover: boolean }) {
  const e = dict.experiences;
  const [pubState, pubAction, pubPending] = useActionState(publishExperience, IDLE);
  const [offState, offAction, offPending] = useActionState(unpublishExperience, IDLE);
  const state = pubState.error || pubState.ok ? pubState : offState;
  const message = state.error ? (state.error.startsWith("db:") ? state.error.slice(3) : (dict.errors as Record<string, string>)[state.error] ?? dict.errors.server) : null;

  return (
    <section aria-label={e.publish} className={`flex flex-col gap-3 rounded-xl border bg-surface p-5 ${site === "live_pending" ? "border-warning" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={site === "live" ? "success" : site === "live_pending" ? "warning" : "neutral"}>{site === "live" ? e.onSite : site === "live_pending" ? e.onSitePending : e.draft}</Badge>
        <p className="text-sm text-fg-muted">{site === "live" ? e.liveNotice : site === "live_pending" ? e.pendingNotice : e.notLiveNotice}</p>
      </div>
      {!hasCover && <p className="text-sm text-fg-muted">{e.noCoverWarning}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {site !== "live" && (
          <form action={pubAction}>
            <input type="hidden" name="id" value={itemId} />
            <Button type="submit" loading={pubPending}>
              {site === "draft" ? e.publish : e.update}
            </Button>
          </form>
        )}
        {site !== "draft" && (
          <>
            <LinkButton href={publicHref} variant="secondary" target="_blank" rel="noopener">
              {e.viewOnSite}
            </LinkButton>
            <form action={offAction} onSubmit={(ev) => { if (!window.confirm(e.confirmUnpublish)) ev.preventDefault(); }}>
              <input type="hidden" name="id" value={itemId} />
              <Button type="submit" variant="ghost" loading={offPending}>
                {e.unpublish}
              </Button>
            </form>
          </>
        )}
      </div>
      {message && (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {message}
        </p>
      )}
      {!message && (pubState.ok || offState.ok) && (
        <p role="status" className="text-sm font-bold text-success">
          {pubState.ok ? e.published : e.removed}
        </p>
      )}
    </section>
  );
}
