"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/session";
import { LOCALES, localizePath } from "@/i18n/config";
import { RAIL_KINDS, regionOf, type RailKind } from "@/lib/calendar/rail";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "@/lib/portal/action-state";
import { isOverseer } from "@/lib/portal/authz";

/**
 * Calendário ferroviário (CAL-001): cadastrar, editar e remover eventos. A janela de anos (atual e
 * próximo) e o acesso são decididos pelo banco (trigger + RLS); aqui validamos cedo e invalidamos o site.
 */
async function overseer(): Promise<{ userId: string } | ActionState> {
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return { error: "unauthenticated" };
  if (!isOverseer(s.profile.global_role)) return { error: "forbidden" };
  return { userId: s.user.id };
}
const isState = (x: unknown): x is ActionState => typeof x === "object" && x !== null && "error" in x;
const str = (fd: FormData, key: string, max = 600) => String(fd.get(key) ?? "").trim().slice(0, max);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function revalidate() {
  revalidatePath("/portal/calendario");
  for (const l of LOCALES) revalidatePath(localizePath(l, "/calendario"));
}

function readFields(fd: FormData): { fields: Record<string, unknown> } | ActionState {
  const name = str(fd, "name", 200);
  if (name.length < 2) return { error: "invalid", field: "name" };
  const starts_on = str(fd, "starts_on", 10);
  if (!DATE.test(starts_on)) return { error: "invalid", field: "starts_on" };
  const ends = str(fd, "ends_on", 10);
  const ends_on = ends && DATE.test(ends) ? ends : null;
  if (ends_on && ends_on < starts_on) return { error: "invalid", field: "ends_on" };
  const country = str(fd, "country", 2).toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) return { error: "invalid", field: "country" };
  const kind = str(fd, "kind") as RailKind;
  if (!RAIL_KINDS.includes(kind)) return { error: "invalid", field: "kind" };
  const url = str(fd, "url", 500);
  if (url && !/^https?:\/\/\S+$/.test(url)) return { error: "invalid", field: "url" };
  return {
    fields: {
      name, starts_on, ends_on, kind, url, country,
      region: regionOf(country),
      city: str(fd, "city", 120),
      description: str(fd, "description", 600),
      description_en: str(fd, "description_en", 600),
      source_note: str(fd, "source_note", 500),
    },
  };
}

export async function createRailEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const who = await overseer();
  if (isState(who)) return fail(fd, who);
  const parsed = readFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("rail_event").insert({ ...parsed.fields, created_by: who.userId, updated_by: who.userId } as never).select("id").single();
  if (error) return fail(fd, { error: dbError(error) });
  revalidate();
  return { ok: true, id: data.id };
}

export async function updateRailEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id", 36);
  const version = Number(fd.get("version"));
  if (!/^[0-9a-f-]{36}$/.test(id) || !Number.isInteger(version)) return fail(fd, { error: "invalid" });
  const who = await overseer();
  if (isState(who)) return fail(fd, who);
  const parsed = readFields(fd);
  if (isState(parsed)) return fail(fd, parsed);
  const supabase = await createClient();
  const { data, error } = await supabase.from("rail_event").update({ ...parsed.fields, updated_by: who.userId } as never).eq("id", id).eq("version", version).select("id");
  if (error) return fail(fd, { error: dbError(error) });
  if (!data?.length) return fail(fd, { error: "conflict" });
  revalidate();
  return { ok: true };
}

export async function deleteRailEvent(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id", 36);
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "invalid" };
  const who = await overseer();
  if (isState(who)) return who;
  const supabase = await createClient();
  const { data, error } = await supabase.from("rail_event").delete().eq("id", id).select("id");
  if (error) return { error: dbError(error) };
  if (!data?.length) return { error: "not_found" };
  revalidate();
  return { ok: true };
}
