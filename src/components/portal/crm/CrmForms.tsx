"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, Textarea } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE, type ActionState } from "@/lib/portal/action-state";
import { addActivity, addContact, createOrganization, moveOrganizationStage, triageChallenge, updateOrganization } from "@/lib/portal/actions/crm";
import type { ChallengeRow, ContactRow, OrganizationRow } from "@/lib/portal/queries/crm";
import { ACTIVITY_KINDS, CHALLENGE_TRANSITIONS, ORGANIZATION_KINDS, PARTNERSHIP_STAGES } from "@/lib/portal/crm-constants";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";

type Dict = Dictionary["portal"];

export function OrganizationForm({ dict, organization, cancelHref }: { dict: Dict; organization?: OrganizationRow; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(organization ? updateOrganization : createOrganization, IDLE as ActionState);
  const c = dict.crm;
  const err = (f: string) => fieldError(state, f, dict);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {organization && (
        <>
          <input type="hidden" name="id" value={organization.id} />
          <input type="hidden" name="version" value={organization.version} />
        </>
      )}
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={c.name} name="name" required minLength={2} maxLength={200} defaultValue={state.values?.name ?? organization?.name} error={err("name")} />
        <Select label={c.kind} name="kind" defaultValue={state.values?.kind ?? organization?.kind ?? "company"} options={ORGANIZATION_KINDS.map((k) => ({ value: k, label: c.kinds[k] }))} error={err("kind")} />
        <Input label={c.sector} name="sector" maxLength={120} defaultValue={state.values?.sector ?? organization?.sector} />
        <Input label={c.website} name="website" type="url" maxLength={300} help={c.websiteHelp} defaultValue={state.values?.website ?? organization?.website} error={err("website")} />
        <Input label={c.city} name="city" maxLength={120} defaultValue={state.values?.city ?? organization?.city} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={c.state} name="state" maxLength={2} defaultValue={state.values?.state ?? organization?.state} />
          <Input label={c.country} name="country" maxLength={2} defaultValue={state.values?.country ?? organization?.country ?? "BR"} />
        </div>
      </div>
      <Textarea label={c.notes} name="notes" maxLength={4000} defaultValue={state.values?.notes ?? organization?.notes} />
      {organization && (
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="public_partner" defaultChecked={organization.public_partner} className="mt-1 size-4" />
            <span>
              {c.publicPartner}
              <span className="block text-xs text-fg-muted">{c.publicPartnerHelp}</span>
            </span>
          </label>
          <Input label={c.brandAuthorizedAt} name="brand_authorized_at" type="date" defaultValue={state.values?.brand_authorized_at ?? organization.brand_authorized_at?.slice(0, 10) ?? ""} error={err("brand_authorized_at")} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {organization ? dict.common.save : dict.common.create}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          {dict.common.cancel}
        </LinkButton>
      </div>
    </form>
  );
}

export function StageForm({ dict, organization }: { dict: Dict; organization: OrganizationRow }) {
  const [state, formAction, pending] = useActionState(moveOrganizationStage, IDLE);
  const c = dict.crm;
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={organization.id} />
      <input type="hidden" name="version" value={organization.version} />
      <Select label={c.stage} name="stage" defaultValue={state.values?.stage ?? organization.stage} options={PARTNERSHIP_STAGES.map((s) => ({ value: s, label: c.stages[s] }))} />
      <Input label={c.stageReason} name="stage_reason" maxLength={500} defaultValue={state.values?.stage_reason ?? organization.stage_reason} error={fieldError(state, "stage_reason", dict)} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {dict.common.save}
        </Button>
      </div>
      <ActionFeedback state={state} dict={dict} />
    </form>
  );
}

export function ContactForm({ dict, organizationId }: { dict: Dict; organizationId: string }) {
  const [state, formAction, pending] = useActionState(addContact, IDLE);
  const c = dict.crm;
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={c.contactName} name="full_name" defaultValue={state.values?.full_name} required minLength={2} maxLength={160} error={fieldError(state, "full_name", dict)} />
        <Input label={c.roleTitle} name="role_title" defaultValue={state.values?.role_title} maxLength={120} />
        <Input label={c.email} name="email" defaultValue={state.values?.email} type="email" maxLength={254} error={fieldError(state, "email", dict)} />
        <Input label={c.phone} name="phone" defaultValue={state.values?.phone} type="tel" maxLength={30} />
      </div>
      <Input label={c.consentNote} name="consent_note" defaultValue={state.values?.consent_note} maxLength={500} help={c.consentNoteHelp} />
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {c.newContact}
        </Button>
      </div>
    </form>
  );
}

export function ActivityForm({ dict, organizationId, contacts }: { dict: Dict; organizationId: string; contacts: ContactRow[] }) {
  const [state, formAction, pending] = useActionState(addActivity, IDLE);
  const c = dict.crm;
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organization_id" value={organizationId} />
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label={c.activityKind} name="kind" defaultValue={state.values?.kind ?? "note"} options={ACTIVITY_KINDS.map((k) => ({ value: k, label: c.activityKinds[k] }))} error={fieldError(state, "kind", dict)} />
        <Select label={c.contact} name="contact_id" defaultValue={state.values?.contact_id ?? ""} options={[{ value: "", label: dict.common.none }, ...contacts.map((x) => ({ value: x.id, label: x.full_name }))]} />
        <Input label={c.occurredAt} name="occurred_at" defaultValue={state.values?.occurred_at} type="datetime-local" />
      </div>
      <Textarea label={c.summary} name="summary" defaultValue={state.values?.summary} required maxLength={4000} rows={3} error={fieldError(state, "summary", dict)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={c.nextAction} name="next_action" defaultValue={state.values?.next_action} maxLength={500} />
        <Input label={c.nextActionAt} name="next_action_at" defaultValue={state.values?.next_action_at} type="date" />
      </div>
      <div>
        <Button type="submit" variant="secondary" loading={pending}>
          {c.newActivity}
        </Button>
      </div>
    </form>
  );
}

export function TriageForm({
  dict,
  challenge,
  triagers,
  organizations,
  canAssign,
}: {
  dict: Dict;
  challenge: ChallengeRow;
  triagers: Array<{ id: string; label: string }>;
  organizations: Array<{ id: string; name: string }>;
  canAssign: boolean;
}) {
  const [state, formAction, pending] = useActionState(triageChallenge, IDLE);
  const c = dict.crm;
  const targets = [challenge.status, ...CHALLENGE_TRANSITIONS[challenge.status]];
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={challenge.id} />
      <input type="hidden" name="version" value={challenge.version} />
      <input type="hidden" name="from" value={challenge.status} />
      <ActionFeedback state={state} dict={dict} />
      <Select label={c.status} name="status" defaultValue={state.values?.status ?? challenge.status} help={c.transitionsHelp} options={targets.map((s) => ({ value: s, label: c.challengeStatus[s] }))} error={fieldError(state, "status", dict)} />
      {canAssign && (
        <>
          <Select label={c.assignedTo} name="assigned_to" defaultValue={state.values?.assigned_to ?? challenge.assigned_to ?? ""} options={[{ value: "", label: c.unassigned }, ...triagers.map((t) => ({ value: t.id, label: t.label }))]} />
          <Select label={c.linkOrganization} name="organization_id" defaultValue={state.values?.organization_id ?? challenge.organization_id ?? ""} options={[{ value: "", label: c.noLink }, ...organizations.map((o) => ({ value: o.id, label: o.name }))]} />
        </>
      )}
      <Textarea label={c.triageNotes} name="triage_notes" maxLength={4000} defaultValue={state.values?.triage_notes ?? challenge.triage_notes} rows={4} />
      <div>
        <Button type="submit" loading={pending}>
          {dict.common.save}
        </Button>
      </div>
    </form>
  );
}
