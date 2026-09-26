import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkItemList } from "@/components/portal/work-items/WorkItemCard";
import { findTemplate } from "@/content/work-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { getProcess, personName } from "@/lib/portal/queries/work-items";
import { processProgress } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Processo" };

/** Acompanhar um processo: progresso geral e as ações de cada etapa, na ordem do modelo. */
export default async function ProcessPage({ params }: PageProps<"/portal/acoes/processos/[id]">) {
  const { id } = await params;
  const dict = getDictionary("pt").portal;
  const p = dict.workItems.processes;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const data = await getProcess(id);
  if (!data) notFound();
  const { process, items } = data;
  const template = findTemplate(process.template);
  const prog = processProgress(items);
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const phases = template?.phases.map((ph) => ({ key: ph.key, label: ph.label })) ?? [...new Set(items.map((i) => i.process_phase))].map((k) => ({ key: k, label: k }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link href="/portal/acoes/processos" className="self-start text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {p.title}
        </Link>
        <h1 className="text-3xl font-black">{process.title}</h1>
        <p className="text-sm text-fg-muted">
          {[template?.name, p.eventDate.replace("{date}", formatDate("pt", new Date(`${process.event_date}T12:00:00-03:00`), { dateStyle: "long" })), process.organization?.name, process.project?.name, personName(process.owner)].filter(Boolean).join(" · ")}
        </p>
        <div className="flex max-w-md flex-col gap-1" data-process-progress={`${prog.done}/${prog.total}`}>
          <span className="text-sm font-bold">{p.progress.replace("{done}", String(prog.done)).replace("{total}", String(prog.total))}</span>
          <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {phases.map((ph) => {
          const list = items.filter((i) => i.process_phase === ph.key);
          const pp = prog.byPhase[ph.key];
          return (
            <WorkItemList key={ph.key} id={`etapa-${ph.key}`} title={`${ph.label}${pp ? ` · ${pp.done}/${pp.total}` : ""}`} items={list} dict={dict} />
          );
        })}
      </div>
    </div>
  );
}
