import Link from "next/link";
import { agoText } from "@/components/portal/coordination/AlertQueue";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { personName, type WorkItemRow } from "@/lib/portal/queries/work-items";
import { daysSince } from "@/lib/portal/coordination";
import { dueDay, isOverdue, type WorkItemPriority, type WorkItemStatus } from "@/lib/portal/work-items";

type Dict = Dictionary["portal"];

export const STATUS_TONE: Record<WorkItemStatus, BadgeTone> = {
  inbox: "neutral",
  planned: "neutral",
  in_progress: "info",
  waiting: "warning",
  blocked: "danger",
  awaiting_approval: "info",
  done: "success",
  cancelled: "neutral",
};
export const PRIORITY_TONE: Record<WorkItemPriority, BadgeTone> = { high: "danger", medium: "neutral", low: "neutral" };

/** Prazo legível: "Hoje · 11:00", "Amanhã", "26/09/2026 · 18:00". */
export function dueText(iso: string, w: Dict["workItems"], now = new Date()): string {
  const day = dueDay(iso, now);
  const time = formatDate("pt", new Date(iso), { hour: "2-digit", minute: "2-digit" });
  const label = day === "today" ? w.today : day === "tomorrow" ? w.tomorrow : formatDate("pt", new Date(iso), { dateStyle: "short" });
  return `${label} · ${time}`;
}

/** "Aguardando Empresa · Fornecedor Curitiba · desde 21/09 (há 3 dias)". */
export function waitingText(item: Pick<WorkItemRow, "waiting_on" | "waiting_note" | "waiting_since">, dict: Dict, now = new Date()): string {
  if (!item.waiting_on) return "";
  const w = dict.workItems;
  const parts = [`${w.waitingLabel}: ${w.waitingParties[item.waiting_on]}`];
  if (item.waiting_note) parts.push(item.waiting_note);
  if (item.waiting_since) {
    parts.push(w.since.replace("{date}", formatDate("pt", new Date(item.waiting_since), { dateStyle: "short" })).replace("{ago}", agoText(daysSince(item.waiting_since, now), dict.coordination.ago)));
  }
  return parts.join(" · ");
}

/**
 * Uma ação numa lista: título (link), tipo quando não é ação comum, situação,
 * prazo (vermelho se atrasada), responsável e, se estiver parada, quem é aguardado.
 */
export function WorkItemCard({ item, dict, showOwner = true, now = new Date() }: { item: WorkItemRow; dict: Dict; showOwner?: boolean; now?: Date }) {
  const w = dict.workItems;
  const late = isOverdue(item, now);
  const meta: string[] = [];
  if (showOwner && item.owner) meta.push(personName(item.owner));
  if (item.project) meta.push(item.project.name);
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4" data-work-item={item.id}>
      <div className="min-w-0">
        <Link href={`/portal/acoes/${item.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {item.title}
        </Link>
        <span className="block text-xs text-fg-muted">
          {[item.due_at ? dueText(item.due_at, w, now) : w.noDue, ...meta].join(" · ")}
        </span>
        {item.status === "waiting" && <span className="block text-xs text-warning">{waitingText(item, dict, now)}</span>}
        {item.status === "awaiting_approval" && item.approver && <span className="block text-xs text-fg-muted">{w.awaitingApprovalOf.replace("{name}", personName(item.approver))}</span>}
        {item.snoozed_until && new Date(item.snoozed_until) > now && (
          <span className="block text-xs text-fg-muted">{w.snooze.until.replace("{date}", formatDate("pt", new Date(item.snoozed_until), { dateStyle: "short" }))}</span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {item.kind !== "action" && <Badge tone="neutral">{w.kinds[item.kind]}</Badge>}
        {item.priority === "high" && <Badge tone={PRIORITY_TONE.high}>{w.priorities.high}</Badge>}
        {late && <Badge tone="danger">{w.overdue}</Badge>}
        <Badge tone={STATUS_TONE[item.status]}>{w.statuses[item.status]}</Badge>
      </div>
    </li>
  );
}

/** Lista com título; some quando vazia (a Mesa mostra só o que importa). */
export function WorkItemList({ title, items, dict, showOwner = true, id }: { title: string; items: WorkItemRow[]; dict: Dict; showOwner?: boolean; id?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-surface">
      <h2 id={id} className="border-b border-line px-4 py-3 text-base font-bold">
        {title} <span className="tabular-nums text-fg-muted">({items.length})</span>
      </h2>
      <ul className="flex flex-col divide-y divide-line">
        {items.map((i) => (
          <WorkItemCard key={i.id} item={i} dict={dict} showOwner={showOwner} />
        ))}
      </ul>
    </section>
  );
}
