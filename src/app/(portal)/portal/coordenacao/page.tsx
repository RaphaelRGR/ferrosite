import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertQueue, ruleText, SEVERITY_TONE } from "@/components/portal/coordination/AlertQueue";
import { IndicatorValue } from "@/components/portal/reports/IndicatorValue";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, formatNumber } from "@/i18n/format";
import { isOverseer } from "@/lib/portal/authz";
import { requireActiveProfile } from "@/lib/portal/context";
import { ALERT_RULE_ORDER, ALERT_RULES, buildAlerts } from "@/lib/portal/coordination";
import { loadCoordinationOverview } from "@/lib/portal/queries/coordination";
import { computeIndicators, defaultPeriod } from "@/lib/portal/queries/reports";

export const metadata: Metadata = { title: "Coordenação" };

const card = "rounded-xl border border-line bg-surface p-5";
const statLink = `${card} block hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`;

/**
 * Central da coordenação (12 / guia 20): acompanhar o curso sem abrir projeto
 * por projeto. Só admin e coordenação (a RLS já limita os dados; aqui a página
 * inteira responde 404 para os demais). Regras em `lib/portal/coordination.ts`.
 */
export default async function CoordinationPage() {
  const dict = getDictionary("pt").portal;
  const { profile } = await requireActiveProfile();
  if (!isOverseer(profile.global_role)) notFound();
  const c = dict.coordination;
  const now = new Date();
  const period = defaultPeriod(now);
  const [overview, report] = await Promise.all([loadCoordinationOverview(now), computeIndicators(period.start, period.end)]);
  const alerts = buildAlerts(overview.input, now);
  const counts = overview.counts;

  const stats: Array<{ label: string; value: number | null; href: string }> = [
    { label: c.counts.activeProjects, value: counts.activeProjects, href: "/portal/projetos?situacao=active" },
    { label: c.counts.overdueMissions, value: counts.overdueMissions, href: "#fila" },
    { label: c.counts.contentInReview, value: counts.contentInReview, href: "/portal/conteudos?situacao=review" },
    { label: c.counts.challengesReceived, value: counts.challengesReceived, href: "/portal/desafios?situacao=received" },
    { label: c.counts.activePartners, value: counts.activePartners, href: "/portal/empresas" },
    { label: c.counts.activePeople, value: counts.activePeople, href: "/portal/pessoas" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">{c.eyebrow}</p>
        <h1 className="mt-1 text-3xl font-black">{c.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-fg-muted">{c.description}</p>
      </header>

      <section aria-labelledby="panorama">
        <h2 id="panorama" className="text-xl font-bold">
          {c.overview}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {stats.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className={statLink}>
                <span className="block text-xs font-bold uppercase tracking-wider text-fg-muted">{s.label}</span>
                <span className="mt-1 block text-3xl font-black tabular-nums">{s.value === null ? dict.common.none : formatNumber("pt", s.value)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="fila" aria-labelledby="fila-titulo" className="scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="fila-titulo" className="text-xl font-bold">
            {c.queue} <span className="tabular-nums text-fg-muted">({alerts.length})</span>
          </h2>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-fg-muted">{c.queueDescription}</p>
        <div className="mt-4">
          <AlertQueue alerts={alerts} dict={c} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="agenda" className={card}>
          <h2 id="agenda" className="text-lg font-bold">
            {c.agenda}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{c.agendaDescription}</p>
          {overview.agenda.length === 0 ? (
            <p className="mt-4 text-sm text-fg-muted">{c.agendaEmpty}</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line text-sm">
              {overview.agenda.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <Link href={`/portal/conteudos/${e.id}`} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {e.title}
                    </Link>
                    <span className="block text-xs text-fg-muted">
                      {formatDate("pt", new Date(e.event_at), { dateStyle: "medium", timeStyle: "short" })}
                      {e.event_place && ` · ${e.event_place}`}
                      {` · ${dict.content.types[e.type as keyof typeof dict.content.types] ?? e.type} (${e.locale.toUpperCase()})`}
                    </span>
                  </span>
                  <Badge tone="neutral">{dict.content.statuses[e.status as keyof typeof dict.content.statuses] ?? e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="indicadores" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="indicadores" className="text-lg font-bold">
              {c.indicators}
            </h2>
            <LinkButton href="/portal/relatorios" variant="secondary" size="sm">
              {c.seeReports}
            </LinkButton>
          </div>
          {!report ? (
            <p className="mt-4 text-sm text-fg-muted">{c.indicatorsUnavailable}</p>
          ) : (
            <dl className="mt-4 flex flex-col divide-y divide-line text-sm">
              {report.indicators.map((ind) => (
                <div key={ind.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <dt className="font-bold">{dict.reports.names[ind.id as keyof typeof dict.reports.names] ?? ind.id}</dt>
                  <dd className="tabular-nums">
                    <IndicatorValue indicator={ind} dict={dict.reports} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      <section aria-labelledby="acoes">
        <h2 id="acoes" className="text-lg font-bold">
          {c.quickActions}
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <LinkButton href="/portal/projetos/novo" size="sm">
            {c.actions.newProject}
          </LinkButton>
          <LinkButton href="/portal/conteudos?situacao=review" variant="secondary" size="sm">
            {c.actions.reviewContent}
          </LinkButton>
          <LinkButton href="/portal/desafios?situacao=received" variant="secondary" size="sm">
            {c.actions.triageChallenges}
          </LinkButton>
          <LinkButton href="/portal/empresas" variant="secondary" size="sm">
            {c.actions.registerContact}
          </LinkButton>
          <LinkButton href="/portal/relatorios" variant="secondary" size="sm">
            {c.actions.generateReport}
          </LinkButton>
          <LinkButton href="/portal/pessoas" variant="secondary" size="sm">
            {c.actions.managePeople}
          </LinkButton>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className={card}>
        <h2 id="como-funciona" className="text-lg font-bold">
          {c.howItWorks}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">{c.howItWorksDescription}</p>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {ALERT_RULE_ORDER.map((rule) => (
            <li key={rule} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
              <Badge tone={SEVERITY_TONE[ALERT_RULES[rule].severity]} className="self-start">
                {c.severity[ALERT_RULES[rule].severity]}
              </Badge>
              <span>
                <span className="font-bold">{c.rules[rule].title}:</span> {ruleText(rule, c)}
              </span>
            </li>
          ))}
        </ul>
        <h3 className="mt-6 text-sm font-bold">{c.notYet}</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-fg-muted">
          {c.notYetItems.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
