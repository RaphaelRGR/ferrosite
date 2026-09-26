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
  return template.replace("{from}", status(e.from)).replace("{to}", to).replace("{note}", NOTE_IN_TEXT.has(e.kind) ? e.note : "");
}

/** Eventos cuja nota já entra no texto (nome do arquivo, passo do checklist) e não vira citação. */
const NOTE_IN_TEXT = new Set(["file_linked", "file_unlinked", "checklist_done"]);

/**
 * Linha do tempo da ação: histórico gerado pelo banco e comentários juntos,
 * do mais antigo ao mais recente. Nota de evento (ex.: o que ajustar) aparece citada.
 */
export function Timeline({ entries, dict, names = {} }: { entries: TimelineEntry[]; dict: Dict; names?: Record<string, string> }) {
  const w = dict.workItems;
  if (entries.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {entries.map((e) => {
        // quem não é da coordenação não lê perfis de fora dos seus projetos: o nome vem da lista de participantes
        const who = e.actor ? personName(e.actor) : e.type === "event" && e.actorId && names[e.actorId] ? names[e.actorId] : e.type === "comment" && e.authorId && names[e.authorId] ? names[e.authorId] : w.system;
        const when = formatDate("pt", new Date(e.at), { dateStyle: "short", timeStyle: "short" });
        return e.type === "comment" ? (
          <li key={e.id} className="rounded-lg border border-line bg-canvas p-3 text-sm" data-timeline="comment">
            <p className="text-xs text-fg-muted">
              <span className="font-bold text-fg">{who}</span> · {when}
            </p>
            <p className="mt-1 whitespace-pre-line">{e.body}</p>
            {e.mentions.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold text-link">
                {e.mentions.map((m) => (
                  <span key={m}>@{names[m] ?? "?"}</span>
                ))}
              </p>
            )}
          </li>
        ) : (
          <li key={e.id} className="px-1 text-sm text-fg-muted" data-timeline="event" data-event={e.kind}>
            <span className="font-bold text-fg">{who}</span> {eventText(e, w)} · {when}
            {e.note && !NOTE_IN_TEXT.has(e.kind) && <q className="mt-1 block border-l-2 border-line-strong pl-3 text-fg">{e.note}</q>}
          </li>
        );
      })}
    </ol>
  );
}
