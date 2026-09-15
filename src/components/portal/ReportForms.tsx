"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { createSnapshot } from "@/lib/portal/actions/reports";
import { ActionFeedback } from "./ActionFeedback";

export function SnapshotForm({ dict, start, end }: { dict: Dictionary["portal"]; start: string; end: string }) {
  const [state, formAction, pending] = useActionState(createSnapshot, IDLE);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="start" value={start} />
      <input type="hidden" name="end" value={end} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} title={dict.reports.snapshotHelp}>
          {dict.reports.snapshot}
        </Button>
        <span className="text-xs text-fg-muted">{dict.reports.snapshotHelp}</span>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}
