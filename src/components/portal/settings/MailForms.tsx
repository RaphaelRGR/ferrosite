"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { dispatchNow, type DispatchState } from "@/lib/portal/actions/mail";
import { ActionFeedback } from "@/components/portal/ActionFeedback";

const IDLE: DispatchState = {};

export function DispatchMailForm({ dict }: { dict: Dictionary["portal"] }) {
  const [state, formAction, pending] = useActionState(dispatchNow, IDLE);
  const r = state.result;
  const summary = r
    ? dict.settings.mail.result
        .replace("{claimed}", String(r.claimed))
        .replace("{sent}", String(r.sent))
        .replace("{requeued}", String(r.requeued))
        .replace("{failed}", String(r.failed))
    : null;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} title={dict.settings.mail.dispatchHelp}>
          {dict.settings.mail.dispatch}
        </Button>
        <span className="text-xs text-fg-muted">{dict.settings.mail.dispatchHelp}</span>
      </div>
      {summary ? (
        <p role="status" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">
          {summary}
        </p>
      ) : (
        <ActionFeedback state={state} dict={dict} />
      )}
    </form>
  );
}
