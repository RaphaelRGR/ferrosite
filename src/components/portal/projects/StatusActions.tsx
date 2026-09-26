"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { ActionFeedback } from "@/components/portal/ActionFeedback";

export interface StatusTarget {
  to: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

/**
 * Botões de transição de estado (projeto ou missão). Um botão por destino
 * permitido — o servidor revalida a transição e a permissão; a mesma action
 * serve lista, Kanban e calendário (10: drag nunca é o único mecanismo).
 */
export function StatusActions({
  action,
  hidden,
  from,
  targets,
  dict,
  label,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  from: string;
  targets: StatusTarget[];
  dict: Dictionary["portal"];
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  if (targets.length === 0) return null;
  return (
    <form action={formAction} className="flex flex-col gap-3" aria-label={label}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="from" value={from} />
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <Button key={t.to} type="submit" name="to" value={t.to} variant={t.variant ?? "secondary"} size="sm" loading={pending}>
            {t.label}
          </Button>
        ))}
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}
