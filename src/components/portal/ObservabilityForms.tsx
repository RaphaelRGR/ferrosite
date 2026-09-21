"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { sendSinkTest, type SinkTestState } from "@/lib/portal/actions/observability";
import { ActionFeedback } from "./ActionFeedback";

const IDLE: SinkTestState = {};

export function SinkTestForm({ dict }: { dict: Dictionary["portal"] }) {
  const [state, formAction, pending] = useActionState(sendSinkTest, IDLE);
  const o = dict.settings.observability;
  const summary = state.stats
    ? o.result.replace("{sent}", String(state.stats.sent)).replace("{failed}", String(state.stats.failed)).replace("{dropped}", String(state.stats.dropped))
    : null;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} title={o.testHelp}>
          {o.test}
        </Button>
        <span className="text-xs text-fg-muted">{o.testHelp}</span>
      </div>
      {summary ? (
        <p role="status" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">
          {state.configured ? summary : o.resultNotConfigured}
        </p>
      ) : (
        <ActionFeedback state={state} dict={dict} />
      )}
    </form>
  );
}
