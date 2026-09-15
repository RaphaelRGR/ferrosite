import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getDictionary } from "@/i18n/dictionaries";
import { safeNextPath } from "@/lib/auth/redirects";
import { LoginForm } from "./LoginForm";

/**
 * /login — sem prefixo de locale (Portal em PT até decisão do escopo PT/EN).
 * Sessão existente já é redirecionada pelo proxy.
 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const dict = getDictionary("pt").auth;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const initialError = typeof params.error === "string" ? params.error : undefined;

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col items-center gap-4 text-center">
        <BrandLogo width={96} />
        <div>
          <h1 className="text-2xl font-black">{dict.title}</h1>
          <p className="mt-1 text-sm text-fg-muted">{dict.description}</p>
        </div>
      </div>

      <LoginForm dict={dict} next={next} initialError={initialError} />

      <p className="mt-6 text-center text-xs text-fg-muted">{dict.noAccount}</p>
      <p className="mt-4 text-center">
        <Link
          href="/pt"
          className="rounded text-xs font-bold uppercase tracking-widest text-fg-muted underline-offset-4 hover:text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {dict.backToSite}
        </Link>
      </p>
    </div>
  );
}
