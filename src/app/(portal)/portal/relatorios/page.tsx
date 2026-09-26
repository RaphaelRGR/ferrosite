import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndicatorValue } from "@/components/portal/reports/IndicatorValue";
import { SnapshotForm } from "@/components/portal/reports/ReportForms";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { computeIndicators, listSnapshots, parsePeriod } from "@/lib/portal/queries/reports";

export const metadata: Metadata = { title: "Relatórios" };

/**
 * Indicadores (19): período como estado de URL; fórmula/fonte visíveis por
 * indicador; "sem dados" quando não há fonte; snapshot imutável e exportação
 * CSV restrita/auditada. Só coordenação/administração.
 */
export default async function ReportsPage({ searchParams }: PageProps<"/portal/relatorios">) {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const r = dict.reports;
  const [report, snapshots] = await Promise.all([period.valid ? computeIndicators(period.start, period.end) : Promise.resolve(null), listSnapshots()]);
  const fmtDate = (d: string) => formatDate("pt", new Date(`${d}T12:00:00-03:00`), { dateStyle: "short" });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black">{r.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{r.description}</p>
      </header>

      <form method="get" action="/portal/relatorios" className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="inicio" className="text-sm font-bold">
            {r.periodStart}
          </label>
          <input id="inicio" name="inicio" type="date" defaultValue={period.start} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fim" className="text-sm font-bold">
            {r.periodEnd}
          </label>
          <input id="fim" name="fim" type="date" defaultValue={period.end} className="min-h-11 rounded-lg border border-line-strong bg-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        </div>
        <button type="submit" className="min-h-11 rounded-full border border-line-strong bg-surface px-5 text-sm font-bold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {r.apply}
        </button>
        <p className="w-full text-xs text-fg-muted">{r.timezone}</p>
      </form>

      {!period.valid ? (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {r.invalidPeriod}
        </p>
      ) : !report ? (
        <EmptyState title={r.unavailable} description="" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-widest text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">{r.indicator}</th>
                  <th scope="col" className="px-4 py-3">{r.value}</th>
                  <th scope="col" className="px-4 py-3">{r.source}</th>
                  <th scope="col" className="px-4 py-3">{r.formula}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.indicators.map((ind) => (
                  <tr key={ind.id}>
                    <th scope="row" className="px-4 py-3 font-bold">
                      {r.names[ind.id as keyof typeof r.names] ?? ind.id}
                    </th>
                    <td className="px-4 py-3 tabular-nums"><IndicatorValue indicator={ind} dict={r} /></td>
                    <td className="px-4 py-3 font-mono text-xs">{ind.source ?? <span className="font-sans text-fg-muted">{r.noData}</span>}</td>
                    <td className="px-4 py-3 text-xs text-fg-muted">{ind.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-fg-muted">
            {fmtDate(report.period.start)} → {fmtDate(report.period.end)} · {r.formulasVersion} {report.formulas_version}
          </p>
          <SnapshotForm dict={dict} start={period.start} end={period.end} />
        </>
      )}

      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">{r.snapshots}</h2>
        <p className="mt-1 text-xs text-fg-muted">{r.exportHelp}</p>
        {snapshots.length === 0 ? (
          <p className="mt-3 text-sm text-fg-muted">{r.noSnapshots}</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line text-sm">
            {snapshots.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-bold">
                    {fmtDate(s.period_start)} → {fmtDate(s.period_end)}
                  </span>
                  <span className="text-fg-muted">
                    {" "}
                    · {formatDate("pt", new Date(s.generated_at), { dateStyle: "short", timeStyle: "short" })} · {r.generatedBy} {s.author?.full_name || s.author?.email} · {r.formulasVersion} {s.formulas_version}
                  </span>
                </span>
                <a href={`/portal/relatorios/${s.id}/export`} className="rounded-full border border-line-strong px-4 py-2 text-xs font-bold hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  {r.export}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
