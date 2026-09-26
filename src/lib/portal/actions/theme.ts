"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseTheme, THEME_COOKIE, type ThemePreference } from "@/lib/portal/theme";

/**
 * Persiste o tema: cookie (aplicação imediata, sem flash) + user_preference
 * quando há sessão. Falha do banco não impede a preferência local.
 */
export async function setThemePreference(theme: ThemePreference): Promise<void> {
  const value = parseTheme(theme);
  const store = await cookies();
  store.set(THEME_COOKIE, value, { path: "/portal", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await supabase.from("user_preference").upsert({ profile_id: user.id, theme: value });
  }
  revalidatePath("/portal", "layout");
}
