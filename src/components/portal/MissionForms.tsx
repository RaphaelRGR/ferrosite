"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { addChecklistItem, addComment, createMission, removeChecklistItem, setAssignee, toggleChecklistItem, updateMission } from "@/lib/portal/actions/missions";
import type { ChecklistRow, MissionRow } from "@/lib/portal/missions";
import { ActionFeedback, fieldError } from "./ActionFeedback";

const PRIORITIES = ["low", "medium", "high"] as const;

/** datetime-local espera "YYYY-MM-DDTHH:mm" no fuso do curso (-03:00). */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function MissionForm({ dict, projectId, slug, mission, cancelHref }: { dict: Dictionary["portal"]; projectId: string; slug: string; mission?: MissionRow; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(mission ? updateMission : createMission, IDLE as ActionState);
  const m = dict.missions;
  const err = (f: string) => fieldError(state, f, dict);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      {mission && (
        <>
          <input type="hidden" name="id" value={mission.id} />
          <input type="hidden" name="version" value={mission.version} />
        </>
      )}
      <ActionFeedback state={state} dict={dict} />
      <Input label={m.titleField} name="title" required minLength={2} maxLength={200} defaultValue={state.values?.title ?? mission?.title} error={err("title")} />
      <Textarea label={m.description} name="description" maxLength={4000} defaultValue={state.values?.description ?? mission?.description} />
      <Textarea label={`${m.deliverables} (${dict.common.optional})`} name="deliverables" maxLength={2000} defaultValue={state.values?.deliverables ?? mission?.deliverables} rows={3} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label={m.priority} name="priority" defaultValue={state.values?.priority ?? mission?.priority ?? "medium"} options={PRIORITIES.map((p) => ({ value: p, label: m.priorities[p] }))} error={err("priority")} />
        <Input label={`${m.dueAt} (${dict.common.optional})`} name="due_at" type="datetime-local" help={m.dueHelp} defaultValue={state.values?.due_at ?? toLocalInput(mission?.due_at ?? null)} error={err("due_at")} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {mission ? dict.common.save : dict.common.create}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}

export function AssigneeForms({
  dict,
  missionId,
  slug,
  candidates,
  assigned,
  canManage,
}: {
  dict: Dictionary["portal"];
  missionId: string;
  slug: string;
  candidates: Array<{ id: string; name: string }>;
  assigned: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(setAssignee, IDLE);
  const m = dict.missions;
  const available = candidates.filter((c) => !assigned.some((a) => a.id === c.id));
  return (
    <div className="flex flex-col gap-3">
      {assigned.length === 0 ? (
        <p className="text-sm text-fg-muted">{m.noAssignees}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {assigned.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{a.name}</span>
              {canManage && (
                <form action={formAction}>
                  <input type="hidden" name="id" value={missionId} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="profile_id" value={a.id} />
                  <input type="hidden" name="op" value="remove" />
                  <Button type="submit" variant="ghost" size="sm" loading={pending}>
                    {m.unassign}
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && available.length > 0 && (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={missionId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="op" value="add" />
          <Select label={m.assign} name="profile_id" defaultValue={state.values?.profile_id} help={m.assignHelp} options={available.map((c) => ({ value: c.id, label: c.name }))} className="min-w-48 flex-1" />
          <Button type="submit" variant="secondary" loading={pending}>
            {m.assign}
          </Button>
        </form>
      )}
      <ActionFeedback state={state} dict={dict} />
    </div>
  );
}

export function ChecklistForms({ dict, missionId, slug, items, canManage }: { dict: Dictionary["portal"]; missionId: string; slug: string; items: ChecklistRow[]; canManage: boolean }) {
  const [addState, addAction, addPending] = useActionState(addChecklistItem, IDLE);
  const [toggleState, toggleAction, togglePending] = useActionState(toggleChecklistItem, IDLE);
  const [removeState, removeAction, removePending] = useActionState(removeChecklistItem, IDLE);
  const m = dict.missions;
  const done = items.filter((i) => i.done).length;
  return (
    <div className="flex flex-col gap-3">
      {items.length > 0 && (
        <p className="text-xs font-bold uppercase tracking-widest text-fg-muted" aria-live="polite">
          {done}/{items.length}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
            <form action={toggleAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={missionId} />
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="item_id" value={item.id} />
              <input type="hidden" name="done" value={String(!item.done)} />
              <button
                type="submit"
                role="checkbox"
                aria-checked={item.done}
                disabled={!canManage || togglePending}
                className="inline-flex size-5 items-center justify-center rounded border border-line-strong bg-surface text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60"
              >
                <span aria-hidden="true">{item.done ? "✓" : ""}</span>
                <span className="sr-only">{item.label}</span>
              </button>
              <span className={item.done ? "line-through text-fg-muted" : ""} aria-hidden="true">
                {item.label}
              </span>
            </form>
            {canManage && (
              <form action={removeAction}>
                <input type="hidden" name="id" value={missionId} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="item_id" value={item.id} />
                <Button type="submit" variant="ghost" size="sm" loading={removePending} aria-label={`${m.removeItem}: ${item.label}`}>
                  ×
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {canManage && (
        <form action={addAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={missionId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="position" value={items.length} />
          <Input label={m.itemLabel} name="label" defaultValue={addState.values?.label} required maxLength={300} error={fieldError(addState, "label", dict)} className="min-w-48 flex-1" />
          <Button type="submit" variant="secondary" loading={addPending}>
            {m.addItem}
          </Button>
        </form>
      )}
      <ActionFeedback state={addState.error ? addState : toggleState.error ? toggleState : removeState.error ? removeState : IDLE} dict={dict} />
    </div>
  );
}

export function CommentForm({ dict, missionId, slug }: { dict: Dictionary["portal"]; missionId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(addComment, IDLE);
  const m = dict.missions;
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={missionId} />
      <input type="hidden" name="slug" value={slug} />
      <Textarea label={m.addComment} name="body" defaultValue={state.values?.body} required maxLength={4000} placeholder={m.commentPlaceholder} rows={3} error={fieldError(state, "body", dict)} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {m.addComment}
        </Button>
      </div>
      <ActionFeedback state={state.error ? state : IDLE} dict={dict} />
    </form>
  );
}
