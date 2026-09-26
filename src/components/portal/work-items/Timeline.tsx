import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { personName, type TimelineEntry } from "@/lib/portal/queries/work-items";
import type { WaitingParty, WorkItemStatus } from "@/lib/portal/work-items";

type Dict = Dictionary["portal"];

/** Texto de um evento do histórico automático ("Andrea aprovou", "Raphael mudou de Planejada para Em execução"). */
function eventText(e: Extract<TimelineEntry, { type: "event" }>, w: Dict["workItems"]): string {
  const template = w.events[e.kind as keyof typeof w.events] ?? e.kind;
  const status = (v: string | null) => (v && v in w.statuses ? w.statuses[v as WorkItemStatus] : (v ?? ""));
  const to = e.kind === "waiting" ? (e.to && e.to in w.waitingParties ? w.waitingParties[e.to as WaitingParty] : "") : status(e.to);
  return template.replace("{from}", status(e.from)).replace("{to}", to).replace("{note}", e.kind.startsWith("file_") ? e.note : "");
}

/**
 * Linha do tempo da ação: histórico gerado pelo banco e comentários juntos,
 * do mais antigo ao mais recente. Nota de evento (ex.: o que ajustar) aparece citada.
 */
export function Timeline({ entries, dict }: { entries: TimelineEntry[]; dict: Dict }) {
  const w = dict.workItems;
  if (entries.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {entries.map((e) => {
        const who = e.actor ? personName(e.actor) : w.system;
        const when = formatDate("pt", new Date(e.at), { dateStyle: "short", timeStyle: "short" });
        return e.type === "comment" ? (
          <li key={e.id} className="rounded-lg border border-line bg-canvas p-3 text-sm" data-timeline="comment">
            <p className="text-xs text-fg-muted">
              <span className="font-bold text-fg">{who}</span> · {when}
            </p>
            <p className="mt-1 whitespace-pre-line">{e.body}</p>
          </li>
        ) : (
          <li key={e.id} className="px-1 text-sm text-fg-muted" data-timeline="event" data-event={e.kind}>
            <span className="font-bold text-fg">{who}</span> {eventText(e, w)} · {when}
            {e.note && !e.kind.startsWith("file_") && <q className="mt-1 block border-l-2 border-line-strong pl-3 text-fg">{e.note}</q>}
          </li>
        );
      })}
    </ol>
  );
}
