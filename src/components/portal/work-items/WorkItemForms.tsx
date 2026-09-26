"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/i18n/dictionaries";
import { toDateTimeLocal } from "@/i18n/format";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { commentWorkItem, decideWorkItem, linkWorkItemFile, transitionWorkItem, updateWorkItem } from "@/lib/portal/actions/work-items";
import { WAITING_PARTIES, WORK_ITEM_KINDS, WORK_ITEM_PRIORITIES, type WorkTransition } from "@/lib/portal/work-items";
import type { WorkItemRow } from "@/lib/portal/queries/work-items";

type Dict = Dictionary["portal"];
type Ref = { id: string; version: number };

const Hidden = ({ item }: { item: Ref }) => (
  <>
    <input type="hidden" name="id" value={item.id} />
    <input type="hidden" name="version" value={item.version} />
  </>
);

/**
 * Botões de andamento que a pessoa pode usar agora (calculados no servidor com
 * o mesmo espelho do banco). "Aguardando…" e "Solicitar alterações" abrem um
 * campo curto antes de enviar; os demais vão direto.
 */
export function WorkItemTransitions({ dict, item, transitions }: { dict: Dict; item: Ref; transitions: WorkTransition[] }) {
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(transitionWorkItem, IDLE as ActionState);
  const [panel, setPanel] = useState<"wait" | "requestChanges" | null>(null);
  if (transitions.length === 0) return null;
  const primary = (t: WorkTransition) => ["approve", "complete", "start", "resume", "requestApproval"].includes(t.label);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) =>
          t.label === "wait" || t.label === "requestChanges" ? (
            <Button key={t.label} variant="secondary" aria-expanded={panel === t.label} onClick={() => setPanel(panel === t.label ? null : t.label)}>
              {w.transitions[t.label]}
            </Button>
          ) : (
            <form key={t.label} action={formAction}>
              <Hidden item={item} />
              <input type="hidden" name="to" value={t.to} />
              <input type="hidden" name="label" value={t.label} />
              <Button type="submit" variant={t.label === "cancel" ? "ghost" : primary(t) ? "primary" : "secondary"} loading={pending}>
                {w.transitions[t.label]}
              </Button>
            </form>
          ),
        )}
      </div>

      {panel === "wait" && (
        <form action={formAction} className="grid gap-3 rounded-lg border border-line bg-canvas p-4 sm:grid-cols-2">
          <Hidden item={item} />
          <input type="hidden" name="to" value="waiting" />
          <input type="hidden" name="label" value="wait" />
          <Select label={w.waitingOn} name="waiting_on" required defaultValue="coordination" options={WAITING_PARTIES.map((p) => ({ value: p, label: w.waitingParties[p] }))} error={fieldError(state, "waiting_on", dict)} />
          <Input label={w.waitingNote} name="waiting_note" maxLength={300} placeholder={w.waitingNotePlaceholder} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={pending}>
              {w.confirmWait}
            </Button>
          </div>
        </form>
      )}

      {panel === "requestChanges" && (
        <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-4">
          <Hidden item={item} />
          <input type="hidden" name="to" value="in_progress" />
          <input type="hidden" name="label" value="requestChanges" />
          <Textarea label={w.changesNote} name="note" required rows={3} maxLength={1000} error={fieldError(state, "note", dict)} autoFocus />
          <div>
            <Button type="submit" loading={pending}>
              {w.confirmChanges}
            </Button>
          </div>
        </form>
      )}
      <ActionFeedback state={state} dict={dict} />
    </div>
  );
}

export function WorkItemDecision({ dict, item }: { dict: Dict; item: Ref }) {
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(decideWorkItem, IDLE as ActionState);
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-4">
      <Hidden item={item} />
      <Textarea label={w.decisionOutcome} name="outcome" required rows={2} maxLength={1000} error={fieldError(state, "outcome", dict)} />
      <div>
        <Button type="submit" loading={pending}>
          {w.decide}
        </Button>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}

export function WorkItemComment({ dict, itemId }: { dict: Dict; itemId: string }) {
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(commentWorkItem, IDLE as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={itemId} />
      <Textarea label={w.comment} name="body" required rows={3} maxLength={4000} placeholder={w.commentPlaceholder} error={fieldError(state, "body", dict)} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {w.send}
        </Button>
      </div>
      {state.error && <ActionFeedback state={state} dict={dict} />}
    </form>
  );
}

export function WorkItemFileLink({ dict, itemId, candidates }: { dict: Dict; itemId: string; candidates: Array<{ id: string; label: string }> }) {
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(linkWorkItemFile, IDLE as ActionState);
  if (candidates.length === 0) return null;
  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={itemId} />
      <div className="min-w-0 flex-1">
        <Select label={w.linkFile} name="file_id" required options={candidates.map((c) => ({ value: c.id, label: c.label }))} error={fieldError(state, "file_id", dict)} />
      </div>
      <Button type="submit" variant="secondary" loading={pending}>
        {w.link}
      </Button>
      {state.error && <ActionFeedback state={state} dict={dict} />}
    </form>
  );
}

export function WorkItemFileUnlink({ dict, itemId, fileId }: { dict: Dict; itemId: string; fileId: string }) {
  const [state, formAction, pending] = useActionState(linkWorkItemFile, IDLE as ActionState);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={itemId} />
      <input type="hidden" name="file_id" value={fileId} />
      <input type="hidden" name="op" value="unlink" />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        {dict.workItems.unlink}
      </Button>
      {state.error && <ActionFeedback state={state} dict={dict} />}
    </form>
  );
}

/** Edição dos dados (só administração/coordenação; o banco recusa o resto). */
export function WorkItemEdit({
  dict,
  item,
  people,
  projects,
  organizations,
}: {
  dict: Dict;
  item: WorkItemRow;
  people: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
}) {
  const w = dict.workItems;
  const [state, formAction, pending] = useActionState(updateWorkItem, IDLE as ActionState);
  const err = (f: string) => fieldError(state, f, dict);
  const v = state.values;
  const peopleOpts = people.map((p) => ({ value: p.id, label: p.name }));
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Hidden item={item} />
      <div className="sm:col-span-2">
        <Input label={w.quickTitle} name="title" required maxLength={200} defaultValue={v?.title ?? item.title} error={err("title")} />
      </div>
      <Select label={w.owner} name="owner_id" required defaultValue={v?.owner_id ?? item.owner_id ?? ""} options={peopleOpts} error={err("owner_id")} />
      <Input label={w.due} name="due_at" type="datetime-local" defaultValue={v?.due_at ?? toDateTimeLocal(item.due_at)} error={err("due_at")} />
      <Select label={w.kind} name="kind" defaultValue={v?.kind ?? item.kind} options={WORK_ITEM_KINDS.map((k) => ({ value: k, label: w.kinds[k] }))} />
      <Select label={w.priority} name="priority" defaultValue={v?.priority ?? item.priority} options={WORK_ITEM_PRIORITIES.map((p) => ({ value: p, label: w.priorities[p] }))} />
      <Select label={w.approver} name="approver_id" defaultValue={v?.approver_id ?? item.approver_id ?? ""} options={[{ value: "", label: w.noApprover }, ...peopleOpts]} error={err("approver_id")} />
      <Select label={w.project} name="project_id" defaultValue={v?.project_id ?? item.project_id ?? ""} options={[{ value: "", label: w.none }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
      <Select label={w.organization} name="organization_id" defaultValue={v?.organization_id ?? item.organization_id ?? ""} options={[{ value: "", label: w.none }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
      <div className="sm:col-span-2">
        <Textarea label={w.descriptionLabel} name="description" rows={4} maxLength={4000} defaultValue={v?.description ?? item.description} />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <div>
          <Button type="submit" loading={pending}>
            {w.save}
          </Button>
        </div>
        <ActionFeedback state={state} dict={dict} />
      </div>
    </form>
  );
}
