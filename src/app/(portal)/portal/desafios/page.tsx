import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHALLENGE_TONE } from "@/components/portal/crm/crm-tones";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { CHALLENGE_STATUSES, listChallenges, type ChallengeStatus } from "@/lib/portal/queries/crm";

export const metadata: Metadata = { title: "Desafios" };

/** Desafios recebidos (13/14): lista por situação; overseers veem todos, orientador só os atribuídos (RLS). */
export default async function ChallengesPage({ searchParams }: PageProps<"/portal/desafios">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role) && profile.global_role !== "advisor") notFound();
  const sp = await searchParams;
  const status = (CHALLENGE_STATUSES as string[]).includes(String(sp.situacao)) ? (sp.situacao as ChallengeStatus) : "all";
  const items = await listChallenges(status);
  const c = dict.crm;
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface text-fg hover:bg-surface-2"}`;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black">{c.challenges}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.challengesDescription}</p>
      </header>
      <nav aria-label={c.filterStatus} className="flex flex-wrap gap-2">
        <Link href="/portal/desafios" aria-current={status === "all" ? "page" : undefined} className={chip(status === "all")}>
          {c.allStatuses}
        </Link>
        {CHALLENGE_STATUSES.map((s) => (
          <Link key={s} href={`/portal/desafios?situacao=${s}`} aria-current={status === s ? "page" : undefined} className={chip(status === s)}>
            {c.challengeStatus[s]}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <EmptyState title={c.emptyChallenges} description="" />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((x) => (
            <li key={x.id}>
              <Link href={`/portal/desafios/${x.id}`} className="flex flex-col gap-1 p-4 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-fg-muted">{x.protocol}</span>
                  <span className="block font-bold">{x.title}</span>
                  <span className="block text-sm text-fg-muted">
                    {x.organization?.name ?? x.organization_name} · {formatDate("pt", new Date(x.created_at), { dateStyle: "short" })}
                    {x.assignee && ` · ${x.assignee.full_name || x.assignee.email}`}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {x.confidentiality_requested && <Badge tone="warning">{c.confidentiality}</Badge>}
                  <Badge tone={CHALLENGE_TONE[x.status]}>{c.challengeStatus[x.status]}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
