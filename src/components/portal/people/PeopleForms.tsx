"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/i18n/dictionaries";
import { IDLE } from "@/lib/portal/action-state";
import { eraseProfileAccount, setProfileAccess } from "@/lib/portal/actions/people";
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
      {/* key pela versão: depois de salvar, o React 19 volta o form ao valor inicial e um select já montado
          não pega o novo defaultValue; sem isto o campo mostrava "Ativa" numa conta já desativada e um
          novo "Aplicar" a reativaria. */}
      <div key={version} className="flex flex-wrap items-end gap-2">
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

/**
 * Excluir conta (ACC-001): só aparece para conta desativada (e nunca a própria). A janela explica o que
 * acontece e pede o e-mail da conta digitado; o banco revalida tudo (erase_profile).
 */
export function EraseAccountButton({ dict, id, email, name }: { dict: Dictionary; id: string; email: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState(eraseProfileAccount, IDLE);
  const t = dict.portal.people;
  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        {t.erase}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.eraseTitle.replace("{name}", name || email)} description={t.eraseDescription}>
        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <Input
            label={t.eraseConfirmLabel.replace("{email}", email)}
            name="confirm_email"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            required
          />
          <ActionFeedback state={state} dict={dict.portal} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t.eraseCancel}
            </Button>
            <Button type="submit" variant="danger" loading={pending} disabled={typed.trim().toLowerCase() !== email.toLowerCase()}>
              {t.eraseConfirm}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
