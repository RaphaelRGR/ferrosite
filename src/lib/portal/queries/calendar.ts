import type { RailEvent } from "@/lib/calendar/rail";
import { createClient } from "@/lib/supabase/server";

/** Calendário ferroviário no Portal (CAL-001): RLS entrega tudo só a admin/coordenação. */
export type RailEventRow = RailEvent & { year: number; source_note: string; version: number; updated_at: string };

export async function listRailEvents(year: number): Promise<RailEventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("rail_event").select("id, name, starts_on, ends_on, year, city, country, region, kind, url, description, description_en, source_note, version, updated_at").eq("year", year).order("starts_on").order("name");
  return (data ?? []) as RailEventRow[];
}

/** Anos com eventos cadastrados (para a aba de anos anteriores). */
export async function listRailYears(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("rail_event").select("year").order("year", { ascending: false }).limit(2000);
  return [...new Set((data ?? []).map((r) => r.year as number))];
}
