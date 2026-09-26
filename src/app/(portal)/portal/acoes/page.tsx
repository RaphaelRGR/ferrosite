import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkItemCard, WorkItemList } from "@/components/portal/work-items/WorkItemCard";
import { WorkItemSnooze, WorkItemTransitions, WorkItemTriage } from "@/components/portal/work-items/WorkItemForms";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listAssignablePeople, listClosedWorkItems, listOpenWorkItems, personName, type WorkItemRow } from "@/lib/portal/queries/work-items";
import { filterTab, groupByWaiting, WORK_TABS, type WorkTab } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Ações" };

const chip = (active: boolean) =>
  `inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${active ? "border-action bg-action text-fg-on-action" : "border-line-strong bg-surface hover:bg-surface-2"}`;

/**
 * Todas as ações (ACT-001/002), só para administração e coordenação. Abas e
 * filtro de responsável são estado de URL.
 * - Entrada: o que ainda não tem dono; organizar = responsável + prazo.
 * - Bloqueios: o que está parado (aguardando terceiros, bloqueado, aguardando
 *   aprovação), com o resumo "por quem estamos esperando".
 * - Adiadas: "lembrar depois"; voltam sozinhas na data marcada.
 */
export default async function WorkItemsPage({ searchParams }: PageProps<"/portal/acoes">) {
  const dict = getDictionary("pt").portal;
  const w = dict.workItems;
  const { profile, userId } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const sp = await searchParams;
  // "aguardando" era o nome antigo de "bloqueios" (ACT-001).
  const asked = sp.aba === "aguardando" ? "bloqueios" : String(sp.aba);
  const tab: WorkTab = (WORK_TABS as readonly string[]).includes(asked) ? (asked as WorkTab) : "abertas";
  const [people, open, closed] = await Promise.all([listAssignablePeople(), listOpenWorkItems(), tab === "concluidas" ? listClosedWorkItems() : Promise.resolve([] as WorkItemRow[])]);
  const owner = typeof sp.responsavel === "string" && people.some((p) => p.id === sp.responsavel) ? sp.responsavel : undefined;
  const byOwner = (list: WorkItemRow[]) => (owner ? list.filter((i) => i.owner_id === owner) : list);
  const now = new Date();
  const counts = Object.fromEntries(WORK_TABS.map((t) => [t, t === "concluidas" ? null : byOwner(filterTab(t, open, now)).length])) as Record<WorkTab, number | null>;
  const items = byOwner(tab === "concluidas" ? closed : filterTab(tab, open, now));
  const href = (t: WorkTab, o = owner) => `/portal/acoes?aba=${t}${o ? `&responsavel=${o}` : ""}`;
  const personOpts = people.map((p) => ({ id: p.id, name: personName(p) }));

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
            {counts[t] ? <span className="tabular-nums opacity-80">{counts[t]}</span> : null}
          </Link>
        ))}
      </nav>
      {tab !== "entrada" && (
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
      )}

      {items.length === 0 ? (
        <EmptyState title={tab === "bloqueios" ? w.blocks.empty : w.empty} description="" />
      ) : tab === "entrada" ? (
        <>
          <p className="text-sm text-fg-muted">{w.triage.hint}</p>
          <ul className="flex flex-col gap-4">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl border border-line bg-surface" data-inbox-item={i.id}>
                <ul>
                  <WorkItemCard item={i} dict={dict} showOwner={false} now={now} />
                </ul>
                <div className="flex flex-col gap-4 border-t border-line p-4">
                  <WorkItemTriage dict={dict} item={i} people={personOpts} me={userId} />
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <WorkItemSnooze dict={dict} itemId={i.id} />
                    <WorkItemTransitions dict={dict} item={i} transitions={[{ to: "cancelled", label: "archive" }]} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : tab === "bloqueios" ? (
        <BlocksView items={items} dict={dict} />
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((i) => (
            <WorkItemCard key={i.id} item={i} dict={dict} now={now} />
          ))}
        </ul>
      )}

    </div>
  );
}

/** Bloqueios: quantas ações estão paradas e por quem esperamos; cada grupo é uma lista. */
function BlocksView({ items, dict }: { items: WorkItemRow[]; dict: ReturnType<typeof getDictionary>["portal"] }) {
  const w = dict.workItems;
  const waiting = groupByWaiting(items);
  const blocked = items.filter((i) => i.status === "blocked");
  const approval = items.filter((i) => i.status === "awaiting_approval");
  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="resumo-bloqueios" className="rounded-xl border border-line bg-surface p-4">
        <h2 id="resumo-bloqueios" className="text-base font-bold">{w.blocks.summary.replace("{count}", String(items.length))}</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {waiting.map((g) => (
            <li key={g.party}>
              <a href={`#aguardando-${g.party}`} className={chip(false)}>
                {w.waitingParties[g.party]} <span className="tabular-nums text-fg-muted">{g.items.length}</span>
              </a>
            </li>
          ))}
          {blocked.length > 0 && (
            <li>
              <a href="#bloqueadas" className={chip(false)}>
                {w.blocks.blocked} <span className="tabular-nums text-fg-muted">{blocked.length}</span>
              </a>
            </li>
          )}
          {approval.length > 0 && (
            <li>
              <a href="#aguardando-aprovacao" className={chip(false)}>
                {w.statuses.awaiting_approval} <span className="tabular-nums text-fg-muted">{approval.length}</span>
              </a>
            </li>
          )}
        </ul>
      </section>
      {waiting.map((g) => (
        <div key={g.party} id={`aguardando-${g.party}`} className="scroll-mt-24">
          <WorkItemList id={`titulo-${g.party}`} title={`${w.waitingLabel}: ${w.waitingParties[g.party]}`} items={g.items} dict={dict} />
        </div>
      ))}
      <div id="bloqueadas" className="scroll-mt-24">
        <WorkItemList id="titulo-bloqueadas" title={w.blocks.blocked} items={blocked} dict={dict} />
      </div>
      <div id="aguardando-aprovacao" className="scroll-mt-24">
        <WorkItemList id="titulo-aprovacao" title={w.statuses.awaiting_approval} items={approval} dict={dict} />
      </div>
    </div>
  );
}
