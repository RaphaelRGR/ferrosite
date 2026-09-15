import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";
import type { Dictionary } from "@/i18n/dictionaries";
import { signOut } from "@/lib/auth/actions";
import type { AccountStatus } from "@/lib/auth/session";

/**
 * Tela de bloqueio para contas autenticadas mas não ativas (pending/disabled).
 * Nada do Portal é renderizado por trás; a RLS nega os dados de qualquer forma.
 */
export function AccessGate({ status, email, dict }: { status: Exclude<AccountStatus, "active">; email: string; dict: Dictionary["auth"] }) {
  const title = status === "pending" ? dict.pendingTitle : dict.disabledTitle;
  const description = status === "pending" ? dict.pendingDescription : dict.disabledDescription;
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 text-center">
      <BrandLogo width={96} />
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-fg-muted">{description}</p>
        <p className="mt-4 text-xs text-fg-muted">
          {dict.signedInAs} <span className="font-bold text-fg">{email}</span>
        </p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          {dict.signOut}
        </Button>
      </form>
    </div>
  );
}
