import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type GlobalRole = "admin" | "coordination" | "advisor" | "member" | "external" | "viewer";
export type AccountStatus = "pending" | "active" | "disabled";

export interface CurrentProfile {
  id: string;
  email: string;
  full_name: string;
  global_role: GlobalRole;
  status: AccountStatus;
}

/**
 * Usuário autenticado + perfil (RLS: o próprio perfil é sempre legível).
 * `cache` deduplica por request entre layout e páginas. Sem sessão ⇒ null.
 */
export const getCurrentSession = cache(async (): Promise<{ user: User; profile: CurrentProfile | null } | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profile")
    .select("id, email, full_name, global_role, status")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (data as CurrentProfile | null) ?? null };
});
