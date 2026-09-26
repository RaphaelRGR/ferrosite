import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileAccessForm } from "@/components/portal/people/PeopleForms";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { canChangePrivileges, canManagePeople } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pessoas" };

/**
 * Pessoas (11/AUTH-003): admin e coordenação veem as contas (RLS profile_select
 * para overseers); só admin altera papel/situação (RLS + trigger, auditado).
 */
export default async function PeoplePage() {
  const dict = getDictionary("pt");
  const p = dict.portal;
  const { profile, userId } = await requireActiveProfile();
  if (!canManagePeople(profile.global_role)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("profile").select("id, email, full_name, global_role, status, version, created_at").order("status").order("full_name");
  const people = data ?? [];
  const editable = canChangePrivileges(profile.global_role);
  const tone = (s: string) => (s === "active" ? "success" : s === "pending" ? "warning" : "danger");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black">{p.people.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{p.people.description}</p>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{editable ? p.people.provisioningNote : p.people.readOnly}</p>
      </header>
      {people.length === 0 ? (
        <EmptyState title={p.people.empty} description="" />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {people.map((person) => (
            <li key={person.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="font-bold">
                  {person.full_name || person.email}
                  {person.id === userId && <span className="ml-2 text-xs font-normal text-fg-muted">({p.people.you})</span>}
                </p>
                <p className="truncate text-sm text-fg-muted">{person.email}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <Badge tone={tone(person.status)}>{p.accountStatus[person.status]}</Badge>
                  <Badge tone="neutral">{p.roles[person.global_role]}</Badge>
                  <span>{formatDate("pt", new Date(person.created_at), { dateStyle: "short" })}</span>
                </p>
              </div>
              {editable && <ProfileAccessForm dict={dict} roles={p.roles} id={person.id} version={person.version} role={person.global_role} status={person.status} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
