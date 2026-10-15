"use client";

import { useActionState, useEffect, useRef } from "react";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryName, RAIL_COUNTRIES, RAIL_KINDS } from "@/lib/calendar/rail";
import { IDLE } from "@/lib/portal/action-state";
import { createRailEvent, deleteRailEvent, updateRailEvent } from "@/lib/portal/actions/calendar";
import type { RailEventRow } from "@/lib/portal/queries/calendar";

type Dict = Dictionary["portal"];

/** Cadastro/edição de um evento do calendário (CAL-001). Datas limitadas ao ano da aba. */
export function RailEventForm({ dict, year, item, cancelHref }: { dict: Dict; year: number; item?: RailEventRow; cancelHref?: string }) {
  const c = dict.calendar;
  const [state, action, pending] = useActionState(item ? updateRailEvent : createRailEvent, IDLE);
  const form = useRef<HTMLFormElement>(null);
  const v = state.values;
  const err = (f: string) => fieldError(state, f, dict);
  // depois de cadastrar, o formulário volta vazio para o próximo evento
  useEffect(() => {
    if (state.ok && !item) form.current?.reset();
  }, [state, item]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-4">
      {item && (
        <>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="version" value={item.version} />
        </>
      )}
      <Input label={c.name} name="name" required minLength={2} maxLength={200} defaultValue={v?.name ?? item?.name ?? ""} error={err("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={c.startsOn} name="starts_on" type="date" required min={`${year}-01-01`} max={`${year}-12-31`} defaultValue={v?.starts_on ?? item?.starts_on ?? ""} error={err("starts_on")} />
        <Input label={c.endsOn} name="ends_on" type="date" min={`${year}-01-01`} defaultValue={v?.ends_on ?? item?.ends_on ?? ""} error={err("ends_on")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={c.city} name="city" maxLength={120} defaultValue={v?.city ?? item?.city ?? ""} />
        <Select
          label={c.country}
          name="country"
          defaultValue={v?.country ?? item?.country ?? "BR"}
          options={[...[...RAIL_COUNTRIES].map((code) => ({ value: code, label: countryName("pt", code) })).sort((a, b) => (a.value === "BR" ? -1 : b.value === "BR" ? 1 : a.label.localeCompare(b.label, "pt-BR"))), { value: "", label: c.online }]}
          error={err("country")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={c.kind} name="kind" defaultValue={v?.kind ?? item?.kind ?? "feira"} options={RAIL_KINDS.map((k) => ({ value: k, label: c.kinds[k] }))} />
      </div>
      <Input label={c.url} name="url" type="url" maxLength={500} defaultValue={v?.url ?? item?.url ?? ""} help={c.urlHelp} error={err("url")} />
      <Textarea label={c.description} name="description" maxLength={600} rows={2} defaultValue={v?.description ?? item?.description ?? ""} />
      <Textarea label={c.descriptionEn} name="description_en" maxLength={600} rows={2} defaultValue={v?.description_en ?? item?.description_en ?? ""} />
      <Input label={c.sourceNote} name="source_note" maxLength={500} defaultValue={v?.source_note ?? item?.source_note ?? ""} help={c.sourceNoteHelp} />
      <ActionFeedback state={state} dict={dict} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {item ? dict.common.save : c.add}
        </Button>
        {cancelHref && (
          <LinkButton href={cancelHref} variant="secondary">
            {dict.common.cancel}
          </LinkButton>
        )}
      </div>
    </form>
  );
}

export function RemoveRailEvent({ dict, id }: { dict: Dict; id: string }) {
  const c = dict.calendar;
  const [state, action, pending] = useActionState(deleteRailEvent, IDLE);
  return (
    <form action={action} onSubmit={(ev) => { if (!window.confirm(c.confirmRemove)) ev.preventDefault(); }} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" loading={pending}>
        {c.remove}
      </Button>
      {state.error && (
        <span role="alert" className="text-xs font-bold text-danger">
          {state.error.startsWith("db:") ? state.error.slice(3) : (dict.errors as Record<string, string>)[state.error] ?? dict.errors.server}
        </span>
      )}
    </form>
  );
}
