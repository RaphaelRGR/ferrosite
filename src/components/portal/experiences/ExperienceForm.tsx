"use client";

import { useActionState, useState } from "react";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { createExperience, updateExperience } from "@/lib/portal/actions/experiences";
import { composeExperienceTitle, EXPERIENCE_KINDS, splitExperienceTitle, type ExperienceFormKind } from "@/lib/portal/experiences";
import type { ExperienceRow } from "@/lib/portal/queries/experiences";

type Dict = Dictionary["portal"];

/**
 * Formulário único da experiência (EXP-001): tipo + nome viram o título do site; pasta do Drive e
 * a confirmação de autorização das fotos só na criação (depois, "Buscar fotos novas" usa a mesma pasta).
 */
export function ExperienceForm({ dict, projects, item, cancelHref }: { dict: Dict; projects: Array<{ id: string; name: string }>; item?: ExperienceRow; cancelHref: string }) {
  const e = dict.experiences;
  const [state, action, pending] = useActionState(item ? updateExperience : createExperience, IDLE);
  const initial = item ? splitExperienceTitle(item.title) : { kind: "visit" as ExperienceFormKind, name: "" };
  const v = state.values;
  const [kind, setKind] = useState<ExperienceFormKind>((v?.kind as ExperienceFormKind) ?? initial.kind);
  const [name, setName] = useState(v?.name ?? initial.name);
  const err = (f: string) => fieldError(state, f, dict);

  return (
    <form action={action} className="flex flex-col gap-5">
      {item && (
        <>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="version" value={item.version} />
        </>
      )}
      <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
        <Select label={e.kind} name="kind" value={kind} onChange={(ev) => setKind(ev.target.value as ExperienceFormKind)} options={EXPERIENCE_KINDS.map((k) => ({ value: k, label: e.kinds[k] }))} />
        <Input label={e.name} name="name" required minLength={2} maxLength={180} value={name} onChange={(ev) => setName(ev.target.value)} help={e.nameHelp} error={err("name")} />
      </div>
      <p className="-mt-2 text-sm text-fg-muted">
        {e.titlePreview}: <strong className="text-fg">{name.trim() ? composeExperienceTitle(kind, name) : "…"}</strong>
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={e.date} name="date" type="date" required defaultValue={v?.date ?? item?.event_at?.slice(0, 10) ?? ""} error={err("date")} />
        <Input label={e.place} name="place" maxLength={200} defaultValue={v?.place ?? item?.event_place ?? ""} help={e.placeHelp} />
      </div>
      <Textarea label={e.summary} name="summary" maxLength={500} rows={2} defaultValue={v?.summary ?? item?.summary ?? ""} help={e.summaryHelp} />
      <Textarea label={e.body} name="body_md" maxLength={20000} rows={8} defaultValue={v?.body_md ?? item?.body_md ?? ""} help={e.bodyHelp} />
      <Select
        label={e.project}
        name="project_id"
        defaultValue={v?.project_id ?? item?.project_id ?? ""}
        options={[{ value: "", label: e.noProject }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
      />
      <Input label={e.folder} name="folder" maxLength={512} defaultValue={v?.folder ?? (item?.photo_folder_id ? `https://drive.google.com/drive/folders/${item.photo_folder_id}` : "")} help={e.folderHelp} error={err("folder")} />
      {!item && (
        <label className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4 text-sm">
          <input type="checkbox" name="authorized" defaultChecked={v?.authorized === "on"} className="mt-0.5 size-5 shrink-0" />
          <span>
            {e.authorized}
            {state.error === "invalid" && state.field === "authorized" && <span className="mt-1 block font-bold text-danger">{e.authorizedRequired}</span>}
          </span>
        </label>
      )}
      <ActionFeedback state={state.error === "invalid" && state.field === "authorized" ? IDLE : state} dict={dict} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {item ? e.save : e.create}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}
