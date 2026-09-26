"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { setProfileAccess } from "@/lib/portal/actions/people";
import type { GlobalRole } from "@/lib/portal/authz";
import { ActionFeedback } from "@/components/portal/ActionFeedback";

const ROLES: GlobalRole[] = ["admin", "coordination", "advisor", "member", "external", "viewer"];
const STATUSES = ["pending", "active", "disabled"] as const;

/** Papel global + situação de uma conta (só admin; trigger audita e protege o último admin). */
export function ProfileAccessForm({ dict, roles, id, version, role, status }: { dict: Dictionary; roles: Dictionary["portal"]["roles"]; id: string; version: number; role: GlobalRole; status: (typeof STATUSES)[number] }) {
  const [state, formAction, pending] = useActionState(setProfileAccess, IDLE);
  const p = dict.portal;
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <div className="flex flex-wrap items-end gap-2">
        <Select label={p.people.role} name="global_role" defaultValue={role} options={ROLES.map((r) => ({ value: r, label: roles[r] }))} className="min-w-44" />
        <Select label={p.people.status} name="status" defaultValue={status} options={STATUSES.map((s) => ({ value: s, label: p.accountStatus[s] }))} className="min-w-36" />
        <Button type="submit" variant="secondary" loading={pending}>
          {p.people.save}
        </Button>
      </div>
      <ActionFeedback state={state} dict={p} />
    </form>
  );
}
