"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { addMember, removeMember, updateMember } from "@/lib/portal/actions/projects";
import { ActionFeedback, fieldError } from "@/components/portal/ActionFeedback";

const ROLES = ["leader", "member", "viewer", "external"] as const;

export function AddMemberForm({ dict, projectId, slug }: { dict: Dictionary["portal"]; projectId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(addMember, IDLE);
  const p = dict.projects;
  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">{p.addMember}</h2>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <ActionFeedback state={state} dict={dict} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label={p.email} name="email" type="email" required help={p.emailHelp} error={fieldError(state, "email", dict)} className="sm:col-span-3 lg:col-span-1" />
        <Select label={p.role} name="role" defaultValue="member" options={ROLES.map((r) => ({ value: r, label: dict.projectRoles[r] }))} />
        <Input label={p.expiresAt} name="expires_at" type="date" help={p.expiresHelp} error={fieldError(state, "expires_at", dict)} />
      </div>
      <div>
        <Button type="submit" loading={pending}>
          {dict.common.add}
        </Button>
      </div>
    </form>
  );
}

export function MemberRowForms({
  dict,
  projectId,
  slug,
  profileId,
  role,
  expiresAt,
  isSelf,
}: {
  dict: Dictionary["portal"];
  projectId: string;
  slug: string;
  profileId: string;
  role: (typeof ROLES)[number];
  expiresAt: string | null;
  isSelf: boolean;
}) {
  const [updState, updAction, updPending] = useActionState(updateMember, IDLE);
  const [remState, remAction, remPending] = useActionState(removeMember, IDLE);
  const p = dict.projects;
  const expires = expiresAt ? expiresAt.slice(0, 10) : "";
  return (
    <div className="flex flex-col gap-2">
      <form action={updAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="profile_id" value={profileId} />
        <Select label={p.role} name="role" defaultValue={role} options={ROLES.map((r) => ({ value: r, label: dict.projectRoles[r] }))} className="min-w-40" />
        <Input label={p.expiresAt} name="expires_at" type="date" defaultValue={expires} error={fieldError(updState, "expires_at", dict)} className="min-w-40" />
        <Button type="submit" variant="secondary" size="md" loading={updPending}>
          {dict.common.save}
        </Button>
      </form>
      {!isSelf && (
        <form action={remAction} className="flex items-center gap-2">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="profile_id" value={profileId} />
          <Button type="submit" variant="danger" size="sm" loading={remPending} title={p.removeHelp}>
            {p.remove}
          </Button>
        </form>
      )}
      <ActionFeedback state={updState.error || updState.ok ? updState : remState} dict={dict} />
    </div>
  );
}
