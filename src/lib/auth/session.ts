import { cache } from "react";
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

/** Identidade vinda do JWT verificado (só o que o Portal usa). */
export interface SessionUser {
  id: string;
  email: string | null;
}

/**
 * Usuário autenticado + perfil (RLS: o próprio perfil é sempre legível).
 * `cache` deduplica por request entre layout e páginas. Sem sessão ⇒ null.
 *
 * PERF-002: `getClaims` verifica a assinatura do JWT localmente (chave ES256 do
 * projeto, JWKS em cache no processo), sem ida ao servidor de auth a cada
 * clique. Conta desativada continua barrada na hora pelo `profile.status`, e a
 * RLS valida o mesmo token em toda consulta.
 */
export const getCurrentSession = cache(async (): Promise<{ user: SessionUser; profile: CurrentProfile | null } | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims.sub;
  if (error || !sub) return null;

  const { data: row } = await supabase
    .from("profile")
    .select("id, email, full_name, global_role, status")
    .eq("id", sub)
    .maybeSingle();

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { user: { id: sub, email }, profile: (row as CurrentProfile | null) ?? null };
});
