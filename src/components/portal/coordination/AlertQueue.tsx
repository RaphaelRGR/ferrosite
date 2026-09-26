import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { ALERT_RULES, groupAlerts, type AlertRuleId, type AlertSeverity, type CoordinationAlert } from "@/lib/portal/coordination";

type Dict = Dictionary["portal"]["coordination"];

export const SEVERITY_TONE: Record<AlertSeverity, BadgeTone> = { high: "danger", medium: "warning", low: "info" };

/** Itens por regra antes de resumir em "+N nesta regra". */
const PER_RULE = 8;

export function agoText(days: number, ago: Dict["ago"]): string {
  if (days === 0) return ago.today;
  return days === 1 ? ago.one : ago.many.replace("{count}", String(days));
}

export function ruleText(rule: AlertRuleId, dict: Dict): string {
  return dict.rules[rule].rule.replace("{threshold}", String(ALERT_RULES[rule].thresholdDays));
}

/**
 * Fila de decisões: um grupo por regra, na ordem de urgência. Cada item mostra
 * a evidência (data + dias) e o botão da próxima ação; a regra fica visível no
 * cabeçalho do grupo para ninguém precisar adivinhar por que o item está ali.
 */
export function AlertQueue({ alerts, dict }: { alerts: CoordinationAlert[]; dict: Dict }) {
  const groups = groupAlerts(alerts);
  if (groups.length === 0) return <EmptyState title={dict.emptyTitle} description={dict.emptyDescription} />;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => {
        const r = dict.rules[g.rule];
        const headingId = `regra-${g.rule}`;
        return (
          <section key={g.rule} aria-labelledby={headingId} data-rule={g.rule} className="rounded-xl border border-line bg-surface">
            <header className="flex flex-col gap-2 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 id={headingId} className="text-lg font-bold">
                  {r.title} <span className="tabular-nums text-fg-muted">({g.items.length})</span>
                </h3>
                <p className="mt-1 text-sm text-fg-muted">
                  <span className="font-bold text-fg">{dict.ruleLabel}:</span> {ruleText(g.rule, dict)}
                </p>
              </div>
              <Badge tone={SEVERITY_TONE[g.severity]} className="self-start">
                {dict.severity[g.severity]}
              </Badge>
            </header>
            <ul className="flex flex-col divide-y divide-line">
              {g.items.slice(0, PER_RULE).map((a) => (
                <li key={a.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={a.href} className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                      {a.title}
                    </Link>
                    {a.context && <span className="block text-xs text-fg-muted">{a.context}</span>}
                    <span className="block text-sm text-fg-muted">
                      {r.evidence.replace("{date}", formatDate("pt", new Date(a.since), { dateStyle: "short" })).replace("{ago}", agoText(a.days, dict.ago))}
                    </span>
                  </div>
                  <LinkButton href={a.href} variant="secondary" size="sm" aria-label={`${r.action}: ${a.title}`} className="shrink-0 self-start sm:self-center">
                    {r.action}
                  </LinkButton>
                </li>
              ))}
            </ul>
            {g.items.length > PER_RULE && <p className="border-t border-line px-5 py-3 text-sm text-fg-muted">{dict.more.replace("{count}", String(g.items.length - PER_RULE))}</p>}
          </section>
        );
      })}
    </div>
  );
}
