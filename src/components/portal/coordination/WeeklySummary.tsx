import Link from "next/link";
import { CopyButton } from "@/components/ui/CopyButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import type { WeeklySummary as Summary } from "@/lib/portal/work-items";

type Dict = Dictionary["portal"];

/** Texto do resumo pronto para colar no WhatsApp: números, por pessoa (✓ feito, ○ a fazer) e próximos prazos. */
export function weeklyText(s: Summary, names: Record<string, string>, dict: Dict): string {
  const k = dict.coordination.weekly;
  const day = (iso: string) => formatDate("pt", new Date(iso), { day: "2-digit", month: "2-digit" });
  const lines = [
    `${k.heading} · ${k.since.replace("{date}", day(s.since))}`,
    `${s.completed} ${k.completed} · ${s.created} ${k.created} · ${s.overdue} ${k.overdue} · ${s.awaitingApproval} ${k.awaitingApproval}.`,
    ...s.people.map((p) => `${names[p.ownerId] ?? "?"}: ${[...p.done.map((t) => `✓ ${t}`), ...p.open.map((t) => `○ ${t}`)].join(" ")}`),
  ];
  if (s.nextWeek.length) lines.push(`${k.nextWeek}: ${s.nextWeek.map((i) => `${day(i.due_at)} ${i.title}`).join("; ")}.`);
  return lines.join("\n");
}

/**
 * Resumo da semana (ACT-004) na Central: o que foi concluído desde segunda, o
 * que entrou, o que atrasou e o que aguarda aprovação; por pessoa e próximos
 * 7 dias. Tudo sai dos dados das ações (nada digitado à mão).
 */
export function WeeklySummary({ summary, names, dict }: { summary: Summary; names: Record<string, string>; dict: Dict }) {
  const k = dict.coordination.weekly;
  const stats = [
    { label: k.completed, value: summary.completed },
    { label: k.created, value: summary.created },
    { label: k.overdue, value: summary.overdue, danger: summary.overdue > 0 },
    { label: k.awaitingApproval, value: summary.awaitingApproval },
  ];
  const empty = summary.completed + summary.created + summary.people.length === 0;
  return (
    <section aria-labelledby="resumo-semana" className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="resumo-semana" className="text-lg font-bold">{k.title}</h2>
          <p className="text-xs text-fg-muted">{k.since.replace("{date}", formatDate("pt", new Date(summary.since), { dateStyle: "short" }))}</p>
        </div>
        <CopyButton text={weeklyText(summary, names, dict)} label={k.copy} copiedLabel={dict.common.copied} />
      </div>
      {empty ? (
        <p className="mt-3 text-sm text-fg-muted">{k.empty}</p>
      ) : (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" data-weekly-stats>
            {stats.map((s) => (
              <li key={s.label} className="rounded-lg border border-line bg-canvas p-3">
                <span className={`block text-2xl font-black tabular-nums ${s.danger ? "text-danger" : ""}`}>{s.value}</span>
                <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted">{s.label}</span>
              </li>
            ))}
          </ul>
          {summary.people.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold">{k.people}</h3>
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {summary.people.map((p) => (
                  <li key={p.ownerId}>
                    <span className="font-bold">{names[p.ownerId] ?? "?"}</span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-fg-muted">
                      {p.done.map((t) => (
                        <span key={`d-${t}`} className="text-success">✓ {t}</span>
                      ))}
                      {p.open.map((t) => (
                        <span key={`o-${t}`}>○ {t}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.nextWeek.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold">{k.nextWeek}</h3>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {summary.nextWeek.slice(0, 8).map((i) => (
                  <li key={i.id}>
                    <span className="tabular-nums text-fg-muted">{formatDate("pt", new Date(i.due_at), { day: "2-digit", month: "2-digit" })}</span>{" "}
                    <Link href={`/portal/acoes/${i.id}`} className="underline-offset-4 hover:underline">
                      {i.title}
                    </Link>
                    {i.owner_id && names[i.owner_id] && <span className="text-fg-muted"> · {names[i.owner_id]}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
