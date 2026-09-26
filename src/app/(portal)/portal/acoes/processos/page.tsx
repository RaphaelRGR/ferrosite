import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { WORK_TEMPLATES } from "@/content/work-templates";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { listProcesses, personName } from "@/lib/portal/queries/work-items";
import { processProgress } from "@/lib/portal/work-items";

export const metadata: Metadata = { title: "Processos" };

/** Processos (ACT-004): modelos disponíveis e o andamento de cada processo criado. */
export default async function ProcessesPage() {
  const dict = getDictionary("pt").portal;
  const p = dict.workItems.processes;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const processes = await listProcesses();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/portal/acoes" className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {dict.workItems.title}
        </Link>
        <h1 className="mt-1 text-3xl font-black">{p.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{p.description}</p>
      </header>

      <section aria-labelledby="modelos">
        <h2 id="modelos" className="text-lg font-bold">{p.templates}</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {WORK_TEMPLATES.map((t) => (
            <li key={t.key} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
              <div>
                <h3 className="text-base font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-fg-muted">{t.description}</p>
                <p className="mt-1 text-xs text-fg-muted">{p.templateCount.replace("{phases}", String(t.phases.length)).replace("{items}", String(t.phases.reduce((n, ph) => n + ph.items.length, 0)))}</p>
              </div>
              <LinkButton href={`/portal/acoes/processos/novo?modelo=${t.slug}`} size="sm" className="self-start">
                {p.use}
              </LinkButton>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lista-processos">
        <h2 id="lista-processos" className="text-lg font-bold">{p.list}</h2>
        {processes.length === 0 ? (
          <div className="mt-3">
            <EmptyState title={p.empty} description="" />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
            {processes.map((pr) => {
              const prog = processProgress(pr.items);
              const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
              const template = WORK_TEMPLATES.find((t) => t.key === pr.template);
              return (
                <li key={pr.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/portal/acoes/processos/${pr.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {pr.title}
                    </Link>
                    <span className="block text-xs text-fg-muted">
                      {[template?.name, p.eventDate.replace("{date}", formatDate("pt", new Date(`${pr.event_date}T12:00:00-03:00`), { dateStyle: "short" })), pr.organization?.name, personName(pr.owner)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <div className="flex min-w-48 flex-col gap-1">
                    <span className="text-xs font-bold text-fg-muted">{p.progress.replace("{done}", String(prog.done)).replace("{total}", String(prog.total))}</span>
                    <span className="block h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                      <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
