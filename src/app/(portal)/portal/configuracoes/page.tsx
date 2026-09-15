import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/portal/ThemeToggle";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentSession } from "@/lib/auth/session";
import { parseTheme, THEME_COOKIE } from "@/lib/portal/theme";

export const metadata: Metadata = { title: "Configurações" };

/** Preferências do usuário: tema (persistido) e dados da conta (somente leitura). */
export default async function PortalSettingsPage() {
  const dict = getDictionary("pt");
  const session = await getCurrentSession();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const profile = session?.profile;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black">{dict.portal.settings.title}</h1>

      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">{dict.portal.settings.appearance}</h2>
        <p className="mt-1 text-sm text-fg-muted">{dict.portal.settings.appearanceHelp}</p>
        <div className="mt-4">
          <ThemeToggle initial={theme} labels={dict.portal.theme} />
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-bold">{dict.portal.settings.account}</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-fg-muted">{dict.auth.email}</dt>
            <dd className="mt-1">{session?.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-widest text-fg-muted">{dict.portal.settings.role}</dt>
            <dd className="mt-1">{profile ? dict.portal.roles[profile.global_role] : "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
