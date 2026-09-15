import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriageForm } from "@/components/portal/CrmForms";
import { CHALLENGE_TONE } from "@/components/portal/crm-tones";
import { Badge } from "@/components/ui/Badge";
import { isCapabilityId, labsWithCapability } from "@/data/capabilities";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { getChallenge, listCrmEvents, listOrganizations, listTriagers } from "@/lib/portal/crm";

export const metadata: Metadata = { title: "Desafio" };

const H2 = "text-xs font-bold uppercase tracking-[0.2em] text-fg-muted";

/**
 * Triagem do desafio (13/14): dados enviados (restritos), laboratórios
 * relacionados por capacidade administrada (orientação, não promessa),
 * situação/atribuição/vínculo e histórico. Nada aqui é publicado.
 */
export default async function ChallengePage({ params }: PageProps<"/portal/desafios/[id]">) {
  const { id } = await params;
  const full = getDictionary("pt");
  const dict = full.portal;
  const { profile } = await requireActiveProfile();
  const overseer = isOverseer(profile.global_role);
  if (!overseer && profile.global_role !== "advisor") notFound();
  const challenge = await getChallenge(id);
  if (!challenge) notFound();
  const [events, triagers, organizations] = await Promise.all([
    overseer ? listCrmEvents({ challengeId: id }) : Promise.resolve([]),
    overseer ? listTriagers() : Promise.resolve([]),
    overseer ? listOrganizations("all") : Promise.resolve([]),
  ]);
  const c = dict.crm;
  const fmt = (iso: string) => formatDate("pt", new Date(iso), { dateStyle: "short", timeStyle: "short" });
  const capabilities = challenge.capability_ids.filter(isCapabilityId);
  const suggested = new Map<string, { acronym: string; name: string; level: string }>();
  for (const cap of capabilities) for (const { lab, level } of labsWithCapability(cap)) if (!suggested.has(lab.id)) suggested.set(lab.id, { acronym: lab.acronym, name: lab.name, level });

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-line pb-4">
        <Link href="/portal/desafios" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {c.challenges}
        </Link>
        <p className="mt-1 font-mono text-sm text-fg-muted">{challenge.protocol}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black">{challenge.title}</h1>
          <Badge tone={CHALLENGE_TONE[challenge.status]}>{c.challengeStatus[challenge.status]}</Badge>
          {challenge.confidentiality_requested && <Badge tone="warning">{c.confidentiality}</Badge>}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-line bg-surface p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className={H2}>{c.organization}</dt>
                <dd className="mt-1">{challenge.organization_name}</dd>
              </div>
              <div>
                <dt className={H2}>{c.linkedOrganization}</dt>
                <dd className="mt-1">
                  {challenge.organization ? (
                    <Link href={`/portal/empresas/${challenge.organization.id}`} className="text-link underline-offset-4 hover:underline">
                      {challenge.organization.name}
                    </Link>
                  ) : (
                    c.noLink
                  )}
                </dd>
              </div>
              <div>
                <dt className={H2}>{c.contact}</dt>
                <dd className="mt-1">
                  {challenge.contact_name} · {challenge.contact_email}
                  {challenge.contact_phone && ` · ${challenge.contact_phone}`}
                </dd>
              </div>
              <div>
                <dt className={H2}>{c.receivedAt}</dt>
                <dd className="mt-1">
                  {fmt(challenge.created_at)} · {c.consentAt} {fmt(challenge.consent_at)}
                </dd>
              </div>
            </dl>
            <h2 className={`${H2} mt-6`}>{c.description}</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{challenge.description}</p>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-lg font-bold">{c.suggestedLabs}</h2>
            {capabilities.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {capabilities.map((cap) => (
                  <Badge key={cap} tone="neutral">
                    {full.capabilities[cap]}
                  </Badge>
                ))}
              </p>
            )}
            {suggested.size === 0 ? (
              <p className="mt-3 text-sm text-fg-muted">{c.noSuggestion}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {[...suggested.entries()].map(([labId, lab]) => (
                  <li key={labId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                    <span>
                      <span className="font-bold">{lab.acronym}</span> — {lab.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge tone={lab.level === "offered" ? "info" : "neutral"}>{lab.level === "offered" ? full.labs.levelOffered : lab.level === "prospective" ? full.labs.levelProspective : full.labs.levelPending}</Badge>
                      <Link href={`/pt/laboratorios/${labId}`} className="text-link underline-offset-4 hover:underline">
                        {full.labs.detail}
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{c.status}</h2>
            <div className="mt-3">
              <TriageForm dict={dict} challenge={challenge} triagers={triagers} organizations={organizations.map((o) => ({ id: o.id, name: o.name }))} canAssign={overseer} />
            </div>
          </section>
          {overseer && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-lg font-bold">{c.history}</h2>
              {events.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">{dict.common.none}</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2 text-sm">
                  {events.map((e) => (
                    <li key={e.id} className="border-l-2 border-line pl-3">
                      <p>
                        <span className="font-bold">{e.actor?.full_name || e.actor?.email || "—"}</span> {c.events[e.kind as keyof typeof c.events] ?? e.kind}
                        {e.kind === "challenge.status" && e.to_value && (
                          <>
                            {" "}
                            → <span className="font-bold">{c.challengeStatus[e.to_value as keyof typeof c.challengeStatus]}</span>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-fg-muted">{fmt(e.occurred_at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
