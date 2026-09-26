"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries/index";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { linkProjectFile, registerFile, updateFile, verifyFile } from "@/lib/portal/actions/content";
import { CONSENT_STATUSES, FILE_LINK_KINDS, FILE_MIME_TYPES, FILE_PROVIDERS, FILE_STATUSES } from "@/lib/portal/content-constants";
import type { FileRow } from "@/lib/portal/queries/content";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";

type Dict = Dictionary["portal"];

/** Metadados de arquivo (registro, verificação, vínculo com projeto). As ações ficam em lib/portal/actions/content.ts, junto da publicação. */
export function FileForm({ dict, file, cancelHref }: { dict: Dict; file?: FileRow; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(file ? updateFile : registerFile, IDLE as ActionState);
  const f = dict.files;
  const err = (k: string) => fieldError(state, k, dict);
  const v = state.values;
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {file && (
        <>
          <input type="hidden" name="id" value={file.id} />
          <input type="hidden" name="version" value={file.version} />
        </>
      )}
      <ActionFeedback state={state} dict={dict} />
      {!file && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label={f.provider} name="provider" defaultValue={v?.provider ?? "google_drive"} options={FILE_PROVIDERS.map((p) => ({ value: p, label: f.providers[p] }))} error={err("provider")} />
          <Input label={f.externalId} name="external_id" required maxLength={512} help={f.externalIdHelp} defaultValue={v?.external_id} error={err("external_id")} />
          <Input label={f.name} name="name" required maxLength={255} defaultValue={v?.name} error={err("name")} />
          <Select label={f.mimeType} name="mime_type" defaultValue={v?.mime_type ?? "image/jpeg"} options={FILE_MIME_TYPES.map((m) => ({ value: m, label: m }))} error={err("mime_type")} />
          <Input label={`${f.sizeBytes} (${dict.common.optional})`} name="size_bytes" inputMode="numeric" pattern="\\d*" maxLength={12} defaultValue={v?.size_bytes} error={err("size_bytes")} />
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={f.credit} name="credit" maxLength={200} defaultValue={v?.credit ?? file?.credit} />
        {file && <Select label={f.status} name="status" defaultValue={v?.status ?? file.status} options={FILE_STATUSES.map((s) => ({ value: s, label: f.statuses[s] }))} />}
        <Input label={f.altText} name="alt_text" maxLength={300} defaultValue={v?.alt_text ?? file?.alt_text} />
        <Input label={f.altTextEn} name="alt_text_en" maxLength={300} defaultValue={v?.alt_text_en ?? file?.alt_text_en} />
        <Select label={f.consent} name="consent" defaultValue={v?.consent ?? file?.consent ?? "pending"} options={CONSENT_STATUSES.map((s) => ({ value: s, label: f.consents[s] }))} error={err("consent")} />
        <Input label={f.consentNote} name="consent_note" maxLength={500} help={f.consentNoteHelp} defaultValue={v?.consent_note ?? file?.consent_note} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {file ? dict.common.save : f.new}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}

/** Verificação no Drive (DRIVE-001): botão único; o servidor consulta o provedor e o trigger audita. */
export function VerifyFileForm({ dict, file }: { dict: Dict; file: FileRow }) {
  const [state, formAction, pending] = useActionState(verifyFile, IDLE as ActionState);
  const f = dict.files;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={file.id} />
      <input type="hidden" name="version" value={file.version} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" loading={pending} title={f.verifyHelp}>
          {f.verify}
        </Button>
        <span className="text-xs text-fg-muted">{f.verifyHelp}</span>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}

export function LinkFileForm({ dict, projectId, slug, candidates }: { dict: Dict; projectId: string; slug: string; candidates: Array<{ id: string; label: string }> }) {
  const [state, formAction, pending] = useActionState(linkProjectFile, IDLE);
  const f = dict.files;
  if (candidates.length === 0) return <p className="text-sm text-fg-muted">{f.noCandidates}</p>;
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <Select label={f.link} name="file_id" options={candidates.map((x) => ({ value: x.id, label: x.label }))} className="min-w-56 flex-1" />
      <Select label={f.linkKind} name="kind" defaultValue="attachment" options={FILE_LINK_KINDS.map((k) => ({ value: k, label: f.kinds[k] }))} />
      <Button type="submit" variant="secondary" loading={pending}>
        {f.link}
      </Button>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}

export function UnlinkFileForm({ dict, projectId, slug, fileId }: { dict: Dict; projectId: string; slug: string; fileId: string }) {
  const [state, formAction, pending] = useActionState(linkProjectFile, IDLE);
  return (
    <form action={formAction}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="file_id" value={fileId} />
      <input type="hidden" name="kind" value="attachment" />
      <input type="hidden" name="op" value="unlink" />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        {dict.files.unlink}
      </Button>
      <ActionFeedback state={state.error ? state : IDLE} dict={dict} />
    </form>
  );
}
