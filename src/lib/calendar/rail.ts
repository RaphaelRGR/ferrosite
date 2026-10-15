/**
 * Calendário ferroviário (CAL-001): regras puras compartilhadas pelo site e pelo Portal. A autoridade
 * sobre o que pode ser editado é o banco (`guard_rail_event_window`); aqui só o espelho para a UI.
 */
export const RAIL_KINDS = ["feira", "congresso", "seminario", "curso", "outro"] as const;
export type RailKind = (typeof RAIL_KINDS)[number];
export const RAIL_REGIONS = ["brasil", "mundo"] as const;
export type RailRegion = (typeof RAIL_REGIONS)[number];

export interface RailEvent {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string | null;
  city: string;
  country: string;
  region: RailRegion;
  kind: RailKind;
  url: string;
  description: string;
  description_en: string;
}

const TZ = "America/Sao_Paulo";

/** Hoje no fuso do curso, como YYYY-MM-DD. */
export function institutionalToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Ano corrente e próximo: os únicos editáveis (o banco decide; isto só esconde botões). */
export function editableYears(now = new Date()): [number, number] {
  const y = Number(institutionalToday(now).slice(0, 4));
  return [y, y + 1];
}

/** Já terminou (o último dia do evento ficou para trás). */
export function isPastEvent(e: Pick<RailEvent, "starts_on" | "ends_on">, today: string): boolean {
  return (e.ends_on ?? e.starts_on) < today;
}

/** Eventos ordenados e agrupados por mês (1 a 12) do início. */
export function groupByMonth<T extends Pick<RailEvent, "starts_on" | "name">>(events: T[]): Array<{ month: number; events: T[] }> {
  const sorted = [...events].sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.name.localeCompare(b.name));
  const out: Array<{ month: number; events: T[] }> = [];
  for (const e of sorted) {
    const m = Number(e.starts_on.slice(5, 7));
    const last = out[out.length - 1];
    if (last?.month === m) last.events.push(e);
    else out.push({ month: m, events: [e] });
  }
  return out;
}

const noon = (d: string) => new Date(`${d}T12:00:00-03:00`);

/** "22 a 25 de setembro" / "22–25 September" no idioma da página (sem travessão). */
export function formatEventRange(locale: "pt" | "en", starts: string, ends: string | null): string {
  const fmt = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-GB", { timeZone: TZ, day: "numeric", month: "long" });
  if (!ends || ends === starts) return fmt.format(noon(starts));
  return fmt.formatRange(noon(starts), noon(ends)).replace(/\s*[–—]\s*/g, locale === "pt" ? " a " : "–");
}

export function monthName(locale: "pt" | "en", month: number): string {
  const s = new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-GB", { timeZone: "UTC", month: "long" }).format(new Date(Date.UTC(2026, month - 1, 15)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Países mais comuns em eventos do setor (o Portal oferece estes; o banco aceita qualquer código ISO). */
export const RAIL_COUNTRIES = ["BR", "AR", "CL", "CO", "MX", "PE", "US", "CA", "DE", "AT", "CH", "FR", "IT", "ES", "PT", "GB", "NL", "BE", "PL", "CZ", "SE", "NO", "FI", "DK", "TR", "AE", "SA", "QA", "EG", "MA", "ZA", "IN", "CN", "JP", "KR", "SG", "TH", "MY", "ID", "AU"] as const;

/** Nome do país no idioma da página, a partir do código ISO (sem tradução manual). */
export function countryName(locale: "pt" | "en", code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  try {
    return new Intl.DisplayNames([locale === "pt" ? "pt-BR" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Brasil ou mundo, a partir do país. */
export function regionOf(country: string): RailRegion {
  return country === "BR" ? "brasil" : "mundo";
}
