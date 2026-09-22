"use server";

import { redirect } from "next/navigation";
import { SITE_URL } from "@/i18n/metadata";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/auth/redirects";

export type AuthActionState = { error?: "credentials" | "config" | "invalid" | "otp"; sent?: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Login por e-mail + senha. Erros são genéricos (não revelam se o e-mail existe). */
export async function signInWithPassword(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  if (!EMAIL.test(email) || password.length < 6) return { error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "credentials" };
  redirect(next);
}

/** Link mágico por e-mail (PKCE): o callback troca o código por sessão. */
export async function signInWithMagicLink(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "config" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNextPath(String(formData.get("next") ?? ""));
  if (!EMAIL.test(email)) return { error: "invalid" };

  const origin = (await headers()).get("origin") ?? SITE_URL.origin;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Só usuários já provisionados: sem auto-cadastro (11: convite → aceite → provisionamento).
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  // Resposta idêntica com ou sem conta, para não revelar existência do e-mail.
  if (error && !/user not found|signups not allowed/i.test(error.message)) return { error: "otp" };
  return { sent: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    // Sair encerra ESTA sessão (scope local); revogar todos os dispositivos é ação administrativa (desativar conta em Pessoas).
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login");
}
