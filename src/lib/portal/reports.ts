import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/**
 * Indicadores (19): a fórmula vive no banco (`compute_indicators`); o painel e
 * a exportação leem o mesmo JSON. Valor `null` = "sem dados" (fonte inexistente).
 */
export interface Indicator {
  id: string;
  value: number | Record<string, number> | null;
  numerator?: number;
  denominator?: number;
  source: string | null;
  formula: string;
}
export interface IndicatorReport {
  period: { start: string; end: string; timezone: string };
  formulas_version: number;
  indicators: Indicator[];
}
export type SnapshotRow = Tables<"report_snapshot"> & { author: Pick<Tables<"profile">, "full_name" | "email"> | null };

export const INDICATOR_IDS = ["active_projects", "missions_done", "late_rate", "organizations_involved", "students_involved", "visits_done", "hours_logged", "challenges_funnel", "funding"] as const;
export type IndicatorId = (typeof INDICATOR_IDS)[number];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Período padrão: últimos 90 dias em America/Sao_Paulo. */
export function defaultPeriod(now = new Date()): { start: string; end: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
  const end = fmt.format(now);
  const start = fmt.format(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000));
  return { start, end };
}

export function parsePeriod(sp: Record<string, string | string[] | undefined>): { start: string; end: string; valid: boolean } {
  const d = defaultPeriod();
  const start = typeof sp.inicio === "string" && DATE.test(sp.inicio) ? sp.inicio : d.start;
  const end = typeof sp.fim === "string" && DATE.test(sp.fim) ? sp.fim : d.end;
  return { start, end, valid: end >= start };
}

export async function computeIndicators(start: string, end: string): Promise<IndicatorReport | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("compute_indicators", { p_start: start, p_end: end });
  if (error || !data) return null;
  return data as unknown as IndicatorReport;
}

export async function listSnapshots(): Promise<SnapshotRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("report_snapshot").select("*, author:generated_by (full_name, email)").order("generated_at", { ascending: false }).limit(50);
  return (data ?? []) as unknown as SnapshotRow[];
}

export async function getSnapshot(id: string): Promise<SnapshotRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("report_snapshot").select("*, author:generated_by (full_name, email)").eq("id", id).maybeSingle();
  return (data as unknown as SnapshotRow | null) ?? null;
}

/** CSV com BOM (Excel/LibreOffice) — mesma fórmula do painel: uma linha por indicador + período/versão. */
export function reportToCsv(report: IndicatorReport, labels: Record<string, string>, generatedAt: string): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["indicador", "valor", "numerador", "denominador", "fonte", "formula", "periodo_inicio", "periodo_fim", "timezone", "versao_formulas", "gerado_em"].map(esc).join(","),
  ];
  for (const ind of report.indicators) {
    const value = ind.value === null ? "" : typeof ind.value === "object" ? JSON.stringify(ind.value) : ind.value;
    lines.push([labels[ind.id] ?? ind.id, value, ind.numerator ?? "", ind.denominator ?? "", ind.source ?? "", ind.formula, report.period.start, report.period.end, report.period.timezone, report.formulas_version, generatedAt].map(esc).join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
