"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { toDateTimeLocal } from "@/i18n/format";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { createContent, rollbackContent, transitionContent, updateContent } from "@/lib/portal/actions/content";
import { CONTENT_TRANSITIONS, CONTENT_TYPES, type ContentStatus } from "@/lib/portal/content-constants";
import type { ContentRow, RevisionRow } from "@/lib/portal/queries/content";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";

type Dict = Dictionary["portal"];

export function ContentForm({
  dict,
  item,
  projects,
  files,
  cancelHref,
}: {
  dict: Dict;
  item?: ContentRow;
  projects: Array<{ id: string; name: string }>;
  files: Array<{ id: string; label: string }>;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(item ? updateContent : createContent, IDLE as ActionState);
  const c = dict.content;
  const err = (f: string) => fieldError(state, f, dict);
  const v = state.values;
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {item && (
        <>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="version" value={item.version} />
        </>
      )}
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-5 sm:grid-cols-3">
        <Select label={c.type} name="type" defaultValue={v?.type ?? item?.type ?? "news"} options={CONTENT_TYPES.map((t) => ({ value: t, label: c.types[t] }))} error={err("type")} />
        <Select label={c.locale} name="locale" defaultValue={v?.locale ?? item?.locale ?? "pt"} options={[{ value: "pt", label: "Português" }, { value: "en", label: "English" }]} error={err("locale")} />
        <Input label={c.slug} name="slug" help={c.slugHelp} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} defaultValue={v?.slug ?? item?.slug} error={err("slug")} />
      </div>
      <Input label={c.titleField} name="title" required minLength={2} maxLength={200} defaultValue={v?.title ?? item?.title} error={err("title")} />
      <Textarea label={c.summary} name="summary" maxLength={500} rows={2} help={c.summaryHelp} defaultValue={v?.summary ?? item?.summary} />
      <Textarea label={c.body} name="body_md" maxLength={20000} rows={12} help={c.bodyHelp} defaultValue={v?.body_md ?? item?.body_md} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={c.eventAt} name="event_at" type="datetime-local" defaultValue={v?.event_at ?? toDateTimeLocal(item?.event_at ?? null)} error={err("event_at")} />
        <Input label={c.eventPlace} name="event_place" maxLength={200} defaultValue={v?.event_place ?? item?.event_place} />
        <Select label={`${c.project} (${dict.common.optional})`} name="project_id" defaultValue={v?.project_id ?? item?.project_id ?? ""} options={[{ value: "", label: dict.common.none }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
        <Select label={`${c.cover} (${dict.common.optional})`} name="cover_file_id" help={c.coverHelp} defaultValue={v?.cover_file_id ?? item?.cover_file_id ?? ""} options={[{ value: "", label: dict.common.none }, ...files.map((f) => ({ value: f.id, label: f.label }))]} />
      </div>
      <Input label={c.sourceNote} name="source_note" maxLength={500} help={c.sourceNoteHelp} defaultValue={v?.source_note ?? item?.source_note} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent_confirmed" defaultChecked={v ? v.consent_confirmed === "on" : item?.consent_confirmed} className="mt-1 size-4" />
        <span>{c.consentConfirmed}</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {item ? dict.common.save : dict.common.create}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}

/** Transições do fluxo editorial: um formulário por destino (comentário/motivo/agendamento quando cabem). */
export function ContentTransitions({ dict, item, canApprove }: { dict: Dict; item: ContentRow; canApprove: boolean }) {
  const [state, formAction, pending] = useActionState(transitionContent, IDLE);
  const c = dict.content;
  const targets = CONTENT_TRANSITIONS[item.status].filter((t) => canApprove || !["approved", "published", "scheduled", "unpublished", "changes_requested"].includes(t));
  if (targets.length === 0) return <p className="text-sm text-fg-muted">{dict.common.none}</p>;
  const label = (t: ContentStatus) => (t === "published" ? c.publish : t === "unpublished" ? c.unpublish : c.moveTo.replace("{status}", c.statuses[t]));
  return (
    <div className="flex flex-col gap-3">
      <ActionFeedback state={state} dict={dict} />
      {targets.map((t) => (
        <form key={t} action={formAction} className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="version" value={item.version} />
          <input type="hidden" name="from" value={item.status} />
          <input type="hidden" name="to" value={t} />
          {(t === "review" || t === "changes_requested" || t === "approved") && <Input label={`${c.comment} (${dict.common.optional})`} name="comment" maxLength={2000} />}
          {t === "unpublished" && <Input label={c.unpublishReason} name="comment" maxLength={2000} required />}
          {t === "scheduled" && <Input label={c.scheduleFor} name="scheduled_for" type="datetime-local" required error={fieldError(state, "scheduled_for", dict)} />}
          <div>
            <Button type="submit" variant={t === "published" ? "primary" : t === "archived" || t === "unpublished" ? "danger" : "secondary"} size="sm" loading={pending}>
              {label(t)}
            </Button>
          </div>
        </form>
      ))}
    </div>
  );
}

export function RollbackForm({ dict, itemId, revision }: { dict: Dict; itemId: string; revision: RevisionRow }) {
  const [state, formAction, pending] = useActionState(rollbackContent, IDLE);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="id" value={itemId} />
      <input type="hidden" name="revision_id" value={revision.id} />
      <Button type="submit" variant="secondary" size="sm" loading={pending} title={dict.content.rollbackHelp}>
        {dict.content.rollback}
      </Button>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}
