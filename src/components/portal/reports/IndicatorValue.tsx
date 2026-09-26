import type { Dictionary } from "@/i18n/dictionaries";
import { formatNumber } from "@/i18n/format";
import type { Indicator } from "@/lib/portal/queries/reports";

/** Valor de um indicador como o painel de Relatórios mostra: "sem dados" quando não há fonte, nunca zero. */
export function IndicatorValue({ indicator: ind, dict: r }: { indicator: Indicator; dict: Dictionary["portal"]["reports"] }) {
  if (ind.value === null) return <span className="text-fg-muted">{r.noData}</span>;
  if (typeof ind.value === "object") return <>{Object.entries(ind.value).map(([k, v]) => `${r.funnel[k as keyof typeof r.funnel] ?? k}: ${formatNumber("pt", v)}`).join(" · ")}</>;
  if (ind.id === "late_rate") return <>{`${formatNumber("pt", ind.value * 100, { maximumFractionDigits: 1 })}% (${ind.numerator}/${ind.denominator} ${r.denominator})`}</>;
  return <>{formatNumber("pt", ind.value)}</>;
}
