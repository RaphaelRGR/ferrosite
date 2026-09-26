import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import type { WorkItemRow } from "@/lib/portal/queries/work-items";
import { buildDesk } from "@/lib/portal/work-items";
import { WorkItemList } from "./WorkItemCard";

type Dict = Dictionary["portal"];

export interface DeskMission {
  id: string;
  title: string;
  due_at: string | null;
  project: { slug: string; name: string } | null;
}

/** Saudação pelo horário do curso (não do servidor). */
function greeting(now: Date, g: Dict["desk"]["greeting"]): string {
  const hour = Number(formatDate("pt", now, { hour: "2-digit", hourCycle: "h23" }));
  return hour < 12 ? g.morning : hour < 18 ? g.afternoon : g.evening;
}

/**
 * Minha Mesa (ACT-001): começa pelo trabalho, não por gráficos. Responde "o
 * que eu tenho que fazer?" em segundos: contadores no topo e as listas na
 * ordem de urgência; lista vazia não aparece.
 */
export function Desk({ dict, items, userId, name, missions, now = new Date() }: { dict: Dict; items: WorkItemRow[]; userId: string; name: string; missions: DeskMission[]; now?: Date }) {
  const d = dict.desk;
  const desk = buildDesk(items, userId, now);
  const counts = [
    { label: d.counts.today, value: desk.today.length, href: "#hoje" },
    { label: d.counts.overdue, value: desk.overdue.length, href: "#atrasadas", danger: desk.overdue.length > 0 },
    { label: d.counts.forMe, value: desk.forMe.length, href: "#com-voce" },
    { label: d.counts.waiting, value: desk.awaitingApproval.length + desk.waiting.length, href: "#aguardando" },
  ];
  const empty = [desk.overdue, desk.today, desk.forMe, desk.awaitingApproval, desk.waiting, desk.next7, desk.later].every((l) => l.length === 0);
  const first = name.split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{d.title}</p>
        <h1 className="mt-1 text-3xl font-black">{first ? `${greeting(now, d.greeting)}, ${first}.` : `${greeting(now, d.greeting)}.`}</h1>
      </header>

      <section aria-labelledby="precisa-de-voce">
        <h2 id="precisa-de-voce" className="text-sm font-bold uppercase tracking-widest text-fg-muted">
          {d.needsYou}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {counts.map((c) => (
            <li key={c.label}>
              <a href={c.href} className="block rounded-xl border border-line bg-surface p-4 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                <span className={`block text-3xl font-black tabular-nums ${c.danger ? "text-danger" : ""}`}>{c.value}</span>
                <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted">{c.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {empty ? (
        <EmptyState title={d.emptyTitle} description={d.emptyDescription} />
      ) : (
        <div className="flex flex-col gap-5">
          <div id="com-voce" className="scroll-mt-24">
            <WorkItemList id="t-com-voce" title={d.sections.forMe} items={desk.forMe} dict={dict} />
          </div>
          <div id="atrasadas" className="scroll-mt-24">
            <WorkItemList id="t-atrasadas" title={d.sections.overdue} items={desk.overdue} dict={dict} showOwner={false} />
          </div>
          <div id="hoje" className="scroll-mt-24">
            <WorkItemList id="t-hoje" title={d.sections.today} items={desk.today} dict={dict} showOwner={false} />
          </div>
          <div id="aguardando" className="flex scroll-mt-24 flex-col gap-5">
            <WorkItemList id="t-aprovacao" title={d.sections.awaitingApproval} items={desk.awaitingApproval} dict={dict} showOwner={false} />
            <WorkItemList id="t-terceiros" title={d.sections.waiting} items={desk.waiting} dict={dict} showOwner={false} />
          </div>
          <WorkItemList id="t-7dias" title={d.sections.next7} items={desk.next7} dict={dict} showOwner={false} />
          <WorkItemList id="t-depois" title={d.sections.later} items={desk.later} dict={dict} showOwner={false} />
        </div>
      )}
      {desk.snoozed > 0 && <p className="text-sm text-fg-muted">{d.snoozed.replace("{count}", String(desk.snoozed))}</p>}

      <section aria-labelledby="minhas-missoes" className="rounded-xl border border-line bg-surface p-5">
        <h2 id="minhas-missoes" className="text-base font-bold">{d.missions}</h2>
        {missions.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">{d.noMissions}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line text-sm">
            {missions.map((m) => (
              <li key={m.id} className="py-2">
                <Link href={`/portal/projetos/${m.project?.slug}/missoes/${m.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {m.title}
                </Link>
                <span className="block text-xs text-fg-muted">
                  {m.project?.name}
                  {m.due_at && ` · ${formatDate("pt", new Date(m.due_at), { dateStyle: "short" })}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <LinkButton href="/portal/acoes" variant="secondary">
          {d.seeAll}
        </LinkButton>
      </div>
    </div>
  );
}
