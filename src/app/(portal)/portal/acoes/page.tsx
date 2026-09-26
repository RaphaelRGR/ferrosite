import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkItemCard, WorkItemList } from "@/components/portal/work-items/WorkItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listAssignablePeople, listWorkItems, personName, WORK_TABS, type WorkTab } from "@/lib/portal/queries/work-items";
import { groupByWaiting } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Ações" };

const chip = (active: boolean) =>
  `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`;

/**
 * Todas as ações (ACT-001), só para administração e coordenação. Abas e filtro
 * de responsável são estado de URL. "Aguardando" agrupa por quem estamos
 * esperando: é a base da visão de bloqueios.
 */
export default async function WorkItemsPage({ searchParams }: PageProps<"/portal/acoes">) {
  const dict = getDictionary("pt").portal;
  const w = dict.workItems;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const sp = await searchParams;
  const tab: WorkTab = (WORK_TABS as readonly string[]).includes(String(sp.aba)) ? (sp.aba as WorkTab) : "abertas";
  const people = await listAssignablePeople();
  const owner = typeof sp.responsavel === "string" && people.some((p) => p.id === sp.responsavel) ? sp.responsavel : undefined;
  const items = await listWorkItems(tab, owner);
  const href = (t: WorkTab, o = owner) => `/portal/acoes?aba=${t}${o ? `&responsavel=${o}` : ""}`;
  const waitingGroups = tab === "aguardando" ? groupByWaiting(items) : [];
  const awaitingApproval = tab === "aguardando" ? items.filter((i) => i.status === "awaiting_approval") : [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black">{w.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{w.description}</p>
      </header>

      <nav aria-label={w.title} className="flex flex-wrap gap-2">
        {WORK_TABS.map((t) => (
          <Link key={t} href={href(t)} aria-current={tab === t ? "page" : undefined} className={chip(tab === t)}>
            {w.tabs[t]}
          </Link>
        ))}
      </nav>
      <nav aria-label={w.filterOwner} className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold">{w.filterOwner}:</span>
        <Link href={href(tab, undefined)} aria-current={!owner ? "page" : undefined} className={chip(!owner)}>
          {w.everyone}
        </Link>
        {people.map((p) => (
          <Link key={p.id} href={href(tab, p.id)} aria-current={owner === p.id ? "page" : undefined} className={chip(owner === p.id)}>
            {personName(p)}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState title={w.empty} description="" />
      ) : tab === "aguardando" ? (
        <div className="flex flex-col gap-5">
          {waitingGroups.length > 0 && (
            <section aria-labelledby="por-quem" className="rounded-xl border border-line bg-surface p-4">
              <h2 id="por-quem" className="text-base font-bold">{w.byParty}</h2>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {waitingGroups.map((g) => (
                  <li key={g.party}>
                    <a href={`#aguardando-${g.party}`} className={chip(false)}>
                      {w.waitingParties[g.party]} <span className="ml-1 tabular-nums text-fg-muted">{g.items.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <WorkItemList id="aguardando-aprovacao" title={w.statuses.awaiting_approval} items={awaitingApproval} dict={dict} />
          {waitingGroups.map((g) => (
            <div key={g.party} id={`aguardando-${g.party}`} className="scroll-mt-24">
              <WorkItemList id={`titulo-${g.party}`} title={`${w.waitingLabel}: ${w.waitingParties[g.party]}`} items={g.items} dict={dict} />
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((i) => (
            <WorkItemCard key={i.id} item={i} dict={dict} />
          ))}
        </ul>
      )}
    </div>
  );
}
