import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityForm, ContactForm, OrganizationForm, StageForm } from "@/components/portal/CrmForms";
import { Badge } from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { getOrganization, listActivities, listContacts, listCrmEvents } from "@/lib/portal/crm";

export const metadata: Metadata = { title: "Organização" };

/** Organização (13): dados, pipeline com motivo, contatos (restritos), interações com próxima ação e histórico. */
export default async function OrganizationPage({ params, searchParams }: PageProps<"/portal/empresas/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const organization = await getOrganization(id);
  if (!organization) notFound();
  const [contacts, activities, events] = await Promise.all([listContacts(id), listActivities(id), listCrmEvents({ organizationId: id })]);
  const c = dict.crm;
  const fmt = (iso: string) => formatDate("pt", new Date(iso), { dateStyle: "short", timeStyle: "short" });
  const editing = sp.editar === "1";

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/empresas" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {c.organizations}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{organization.name}</h1>
          <Badge tone={organization.stage === "confirmed" ? "success" : organization.stage === "lost" ? "danger" : "neutral"}>{c.stages[organization.stage]}</Badge>
          {organization.public_partner && <Badge tone="info">{c.publicPartner}</Badge>}
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          {c.kinds[organization.kind]} · {[organization.sector, organization.city, organization.state, organization.country].filter(Boolean).join(" · ")}
        </p>
      </header>

      {editing ? (
        <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-6">
          <h2 className="mb-5 text-lg font-bold">{c.editOrganization}</h2>
          <OrganizationForm dict={dict} organization={organization} cancelHref={`/portal/empresas/${id}`} />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-8">
            <section className="rounded-xl border border-line bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">{c.notes}</h2>
                <Link href={`/portal/empresas/${id}?editar=1`} className="rounded-full border border-line-strong px-4 py-2 text-xs font-bold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {dict.common.edit}
                </Link>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{organization.notes || dict.common.none}</p>
              {organization.website && (
                <p className="mt-3 text-sm">
                  <a href={organization.website} rel="noreferrer noopener" className="text-link underline-offset-4 hover:underline">
                    {organization.website}
                  </a>
                </p>
              )}
            </section>

            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-lg font-bold">{c.contacts}</h2>
              {contacts.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{c.noContacts}</p>
              ) : (
                <ul className="mt-3 flex flex-col divide-y divide-line">
                  {contacts.map((x) => (
                    <li key={x.id} className="py-3 text-sm">
                      <p className="font-bold">
                        {x.full_name} {x.role_title && <span className="font-normal text-fg-muted">· {x.role_title}</span>}
                      </p>
                      <p className="text-fg-muted">{[x.email, x.phone].filter(Boolean).join(" · ") || dict.common.none}</p>
                      {x.consent_note && <p className="text-xs text-fg-muted">{c.consentNote}: {x.consent_note}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-line pt-5">
                <ContactForm dict={dict} organizationId={id} />
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-lg font-bold">{c.activities}</h2>
              {activities.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{c.noActivities}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-3">
                  {activities.map((a) => (
                    <li key={a.id} className="rounded-lg border border-line bg-canvas px-4 py-3 text-sm">
                      <p className="text-xs text-fg-muted">
                        <span className="font-bold text-fg">{c.activityKinds[a.kind]}</span> · {fmt(a.occurred_at)}
                        {a.contact?.full_name && ` · ${a.contact.full_name}`}
                      </p>
                      <p className="mt-1 whitespace-pre-line">{a.summary}</p>
                      {a.next_action && (
                        <p className="mt-1 text-xs">
                          <span className="font-bold">{c.nextAction}:</span> {a.next_action}
                          {a.next_action_at && ` · ${formatDate("pt", new Date(a.next_action_at), { dateStyle: "short" })}`}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-5 border-t border-line pt-5">
                <ActivityForm dict={dict} organizationId={id} contacts={contacts} />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.stage}</h2>
              <div className="mt-3">
                <StageForm dict={dict} organization={organization} />
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.history}</h2>
              {events.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{dict.common.none}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {events.map((e) => (
                    <li key={e.id} className="border-l-2 border-line pl-3">
                      <p>
                        <span className="font-bold">{e.actor?.full_name || e.actor?.email || dict.common.none}</span> {c.events[e.kind as keyof typeof c.events] ?? e.kind}
                        {e.kind === "organization.stage" && e.to_value && (
                          <>
                            {" "}
                            → <span className="font-bold">{c.stages[e.to_value as keyof typeof c.stages]}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-fg-muted">{fmt(e.occurred_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
