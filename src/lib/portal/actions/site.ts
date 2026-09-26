"use server";

import { revalidatePath } from "next/cache";
import { LOCALES, localizePath } from "@/i18n/config";
import { getCurrentSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, type ActionState } from "../action-state";
import { isOverseer } from "../authz";

// Arquivo "use server" só pode exportar funções assíncronas: as chaves ficam em content-constants.
const SITE_IMAGE_KEYS = ["home_hero", "course_hero"] as const;

/** Define/remove a imagem institucional de uma posição do site (RLS: coordenação; trigger audita). */
export async function setSiteImage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const key = String(fd.get("key") ?? "");
  const fileId = String(fd.get("file_id") ?? "").trim();
  if (!(SITE_IMAGE_KEYS as readonly string[]).includes(key)) return fail(fd, { error: "invalid", field: "key" });
  if (fileId && !/^[0-9a-f-]{36}$/.test(fileId)) return fail(fd, { error: "invalid", field: "file_id" });
  const s = await getCurrentSession();
  if (!s?.profile || s.profile.status !== "active") return fail(fd, { error: "unauthenticated" });
  if (!isOverseer(s.profile.global_role)) return fail(fd, { error: "forbidden" });
  const supabase = await createClient();
  const { error } = fileId
    ? await supabase.from("site_image").upsert({ key, file_id: fileId, updated_by: s.user.id }, { onConflict: "key" })
    : await supabase.from("site_image").delete().eq("key", key);
  if (error) return fail(fd, { error: dbError(error) });
  revalidatePath("/portal/configuracoes");
  for (const l of LOCALES) {
    revalidatePath(localizePath(l, "/"));
    revalidatePath(localizePath(l, "/curso"));
  }
  return { ok: true };
}
