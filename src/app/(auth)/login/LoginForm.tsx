"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signInWithMagicLink, signInWithPassword, type AuthActionState } from "@/lib/auth/actions";
import type { Dictionary } from "@/i18n/dictionaries";

const INITIAL: AuthActionState = {};

function errorMessage(dict: Dictionary["auth"], error: AuthActionState["error"] | string | null | undefined) {
  switch (error) {
    case "credentials":
      return dict.errorCredentials;
    case "invalid":
      return dict.errorInvalid;
    case "config":
      return dict.errorConfig;
    case "callback":
      return dict.errorCallback;
    case "otp":
      return dict.errorOtp;
    default:
      return null;
  }
}

/**
 * Formulário de login: senha (ação principal) e link mágico (alternativa).
 * Estado e erros vêm de Server Actions; nada de auth roda no cliente.
 */
export function LoginForm({ dict, next, initialError }: { dict: Dictionary["auth"]; next: string; initialError?: string }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, INITIAL);
  const [otpState, otpAction, otpPending] = useActionState(signInWithMagicLink, INITIAL);
  const error = errorMessage(dict, passwordState.error ?? otpState.error ?? initialError);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-lg border border-danger bg-surface px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {otpState.sent && (
        <p role="status" className="rounded-lg border border-success bg-surface px-4 py-3 text-sm font-bold text-success">
          {dict.magicLinkSent}
        </p>
      )}

      <form action={passwordAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Input label={dict.email} name="email" type="email" autoComplete="email" required />
        <Input label={dict.password} name="password" type="password" autoComplete="current-password" required minLength={6} />
        <Button type="submit" loading={passwordPending} className="mt-2 w-full">
          {dict.signIn}
        </Button>
      </form>

      <p className="text-center text-xs font-bold uppercase tracking-widest text-fg-muted" aria-hidden="true">
        {dict.or}
      </p>

      <form action={otpAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Input label={dict.email} name="email" type="email" autoComplete="email" required />
        <Button type="submit" variant="secondary" loading={otpPending} className="w-full">
          {dict.magicLink}
        </Button>
      </form>
    </div>
  );
}
