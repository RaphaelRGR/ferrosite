"use client";

import { useActionState } from "react";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { createWorkProcess } from "@/lib/portal/actions/work-items";
import type { QuickCreateOptions } from "./QuickCreate";

/** Criar processo a partir de um modelo: nome, data que ancora os prazos, responsável e quem aprova. */
export function ProcessForm({
  dict,
  templateKey,
  eventLabel,
  titlePlaceholder,
  needsApprover,
  options,
  defaultApprover,
}: {
  dict: Dictionary["portal"];
  templateKey: string;
  eventLabel: string;
  titlePlaceholder: string;
  needsApprover: boolean;
  options: QuickCreateOptions;
  defaultApprover?: string;
}) {
  const f = dict.workItems.processes.form;
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(createWorkProcess, IDLE as ActionState);
  const err = (k: string) => fieldError(state, k, dict);
  const v = state.values;
  const people = options.people.map((p) => ({ value: p.id, label: p.id === options.me ? `${p.name} (${w.me})` : p.name }));
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="template" value={templateKey} />
      <div className="sm:col-span-2">
        <Input label={f.title} name="title" required maxLength={200} placeholder={titlePlaceholder} defaultValue={v?.title} error={err("title")} />
      </div>
      <Input label={eventLabel} name="event_date" type="date" required defaultValue={v?.event_date} error={err("event_date")} />
      <Select label={f.owner} name="owner_id" required defaultValue={v?.owner_id ?? options.me} options={people} help={f.ownerHelp} error={err("owner_id")} />
      {needsApprover && (
        <Select label={f.approver} name="approver_id" required defaultValue={v?.approver_id ?? defaultApprover ?? ""} options={[{ value: "", label: w.noApprover }, ...people]} help={f.approverHelp} error={err("approver_id")} />
      )}
      <Select label={f.organization} name="organization_id" defaultValue={v?.organization_id ?? ""} options={[{ value: "", label: w.none }, ...options.organizations.map((o) => ({ value: o.id, label: o.name }))]} />
      <Select label={f.project} name="project_id" defaultValue={v?.project_id ?? ""} options={[{ value: "", label: w.none }, ...options.projects.map((p) => ({ value: p.id, label: p.name }))]} />
      <div className="flex flex-col gap-3 sm:col-span-2">
        <div>
          <Button type="submit" loading={pending}>
            {f.submit}
          </Button>
        </div>
        <ActionFeedback state={state} dict={dict} />
      </div>
    </form>
  );
}
