"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { createWorkItem } from "@/lib/portal/actions/work-items";
import { WORK_ITEM_KINDS, WORK_ITEM_PRIORITIES, type DuePreset } from "@/lib/portal/work-items";

type Dict = Dictionary["portal"];
export interface QuickCreateOptions {
  me: string;
  people: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
}

const WHEN: DuePreset[] = ["today", "tomorrow", "week", "date", "none"];

/**
 * "+ Nova ação" (ACT-001): três perguntas (o quê, quem, quando) e o resto em
 * "Mais opções". Criar precisa ser mais rápido do que escrever no WhatsApp.
 */
export function QuickCreate({ dict, options }: { dict: Dict; options: QuickCreateOptions }) {
  const w = dict.workItems;
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState<DuePreset>("tomorrow");
  const [kind, setKind] = useState("action");
  const [state, formAction, pending] = useActionState(createWorkItem, IDLE as ActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const err = (f: string) => fieldError(state, f, dict);
  const v = state.values;

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const people = options.people.map((p) => ({ value: p.id, label: p.id === options.me ? `${p.name} (${w.me})` : p.name }));
  const chip = (active: boolean) =>
    `inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-bold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" className="max-sm:px-3 max-[359px]:px-2">
        <span aria-hidden="true">+</span>
        {/* no celular só o "+", para caber ao lado do tema e de Sair */}
        <span className="max-sm:sr-only">{w.newItem}</span>
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={w.newItem}>
        <form ref={formRef} action={formAction} className="mt-5 flex flex-col gap-5">
          <Input label={w.quickTitle} name="title" required maxLength={200} placeholder={w.quickTitlePlaceholder} defaultValue={v?.title} error={err("title")} autoFocus />
          {/* sem responsável = Entrada, para organizar depois */}
          <Select label={w.owner} name="owner_id" defaultValue={v?.owner_id ?? options.me} options={[...people, { value: "", label: w.inboxOwner }]} error={err("owner_id")} />

          <fieldset>
            <legend className="mb-2 text-sm font-bold">{w.when}</legend>
            <div className="flex flex-wrap gap-2">
              {WHEN.map((k) => (
                <label key={k} className={chip(when === k)}>
                  <input type="radio" name="when" value={k} checked={when === k} onChange={() => setWhen(k)} className="sr-only" />
                  {w.whenOptions[k]}
                </label>
              ))}
            </div>
            {when !== "none" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {when === "date" && <Input label={w.dueDate} name="due_date" type="date" required error={err("due_date")} />}
                <Input label={w.dueTime} name="due_time" type="time" />
              </div>
            )}
          </fieldset>

          <details className="rounded-lg border border-line p-4 [&[open]>summary]:mb-4">
            <summary className="cursor-pointer text-sm font-bold">{w.moreOptions}</summary>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label={w.kind} name="kind" value={kind} onChange={(e) => setKind(e.target.value)} options={WORK_ITEM_KINDS.map((k) => ({ value: k, label: w.kinds[k] }))} help={w.kindHelp} />
              <Select label={w.priority} name="priority" defaultValue={v?.priority ?? "medium"} options={WORK_ITEM_PRIORITIES.map((p) => ({ value: p, label: w.priorities[p] }))} />
              <Select label={w.approver} name="approver_id" defaultValue={v?.approver_id ?? ""} options={[{ value: "", label: w.noApprover }, ...people]} error={err("approver_id")} />
              <Select label={w.project} name="project_id" defaultValue={v?.project_id ?? ""} options={[{ value: "", label: w.none }, ...options.projects.map((p) => ({ value: p.id, label: p.name }))]} />
              <Select label={w.organization} name="organization_id" defaultValue={v?.organization_id ?? ""} options={[{ value: "", label: w.none }, ...options.organizations.map((o) => ({ value: o.id, label: o.name }))]} />
              <div className="sm:col-span-2">
                <Textarea label={w.descriptionLabel} name="description" rows={3} maxLength={4000} defaultValue={v?.description} />
              </div>
              {kind === "decision" && (
                <div className="sm:col-span-2">
                  <Textarea label={w.decisionOptions} name="decision_options" rows={3} maxLength={2000} defaultValue={v?.decision_options} help={w.decisionOptionsHelp} error={err("decision_options")} />
                </div>
              )}
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending}>
              {w.create}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </Button>
          </div>
          {state.ok && state.id ? (
            <p role="status" className="rounded-lg border border-success bg-surface px-4 py-3 text-sm">
              <span className="font-bold text-success">{w.created}</span>{" "}
              <Link href={`/portal/acoes/${state.id}`} onClick={() => setOpen(false)} className="font-bold underline underline-offset-4">
                {w.open}
              </Link>
            </p>
          ) : (
            <ActionFeedback state={state} dict={dict} />
          )}
        </form>
      </Dialog>
    </>
  );
}
