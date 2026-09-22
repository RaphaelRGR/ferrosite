import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DispatchMailForm } from "@/components/portal/MailForms";
import { SinkTestForm } from "@/components/portal/ObservabilityForms";
import { SiteImageForm } from "@/components/portal/SiteImageForm";
import { listSiteImageCandidates, getSiteImages } from "@/lib/portal/content";
import { ThemeToggle } from "@/components/portal/ThemeToggle";
import { LinkButton } from "@/components/ui/LinkButton";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentSession } from "@/lib/auth/session";
import { formatDate } from "@/i18n/format";
import { isMailConfigured } from "@/lib/mail/provider";
import { isErrorSinkConfigured } from "@/lib/observability/sink";
import { isOverseer } from "@/lib/portal/authz";
import { getMailSummary, type MailStatus } from "@/lib/portal/mail";
import { parseTheme, THEME_COOKIE } from "@/lib/portal/theme";

export const metadata: Metadata = { title: "Configurações" };

const MAIL_STATUSES: MailStatus[] = ["queued", "sent", "failed"];

/** Preferências do usuário: tema (persistido), dados da conta (somente leitura) e, para admin, a fila de e-mails (MAIL-001). */
export default async function PortalSettingsPage() {
  const dict = getDictionary("pt");
  const session = await getCurrentSession();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const profile = session?.profile;
  const isAdmin = profile?.global_role === "admin" && profile.status === "active";
  const mailSummary = isAdmin ? await getMailSummary() : [];
  const mailConfigured = isMailConfigured();
  const sinkConfigured = isErrorSinkConfigured();
  const overseer = isOverseer(profile?.global_role) && profile?.status === "active";
  const [siteImages, imageCandidates] = overseer ? await Promise.all([getSiteImages(), listSiteImageCandidates()]) : [new Map<string, string>(), []];

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
            <dd className="mt-1">{profile ? dict.portal.roles[profile.global_role] : dict.portal.common.none}</dd>
          </div>
        </dl>
      </section>

      {overseer ? (
        <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="site-images-title">
          <h2 id="site-images-title" className="text-lg font-bold">{dict.portal.settings.siteImages.title}</h2>
          <div className="mt-4">
            <SiteImageForm dict={dict.portal} imageKey="home_hero" current={siteImages.get("home_hero") ?? null} candidates={imageCandidates} />
          </div>
        </section>
      ) : null}

      {overseer ? (
        <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="integrations-title">
          <h2 id="integrations-title" className="text-lg font-bold">{dict.portal.integrations.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.portal.integrations.openHelp}</p>
          <div className="mt-4">
            <LinkButton href="/portal/configuracoes/integracoes" variant="secondary">
              {dict.portal.integrations.open} →
            </LinkButton>
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="mail-title">
          <h2 id="mail-title" className="text-lg font-bold">{dict.portal.settings.mail.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.portal.settings.mail.help}</p>
          <p className={`mt-3 text-sm font-bold ${mailConfigured ? "text-success" : "text-warning"}`}>
            {mailConfigured ? dict.portal.settings.mail.configured : dict.portal.settings.mail.notConfigured}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            {MAIL_STATUSES.map((status) => {
              const row = mailSummary.find((s) => s.status === status);
              return (
                <div key={status} className="rounded-lg border border-line p-3">
                  <dt className="text-xs font-bold uppercase tracking-widest text-fg-muted">{dict.portal.settings.mail[status]}</dt>
                  <dd className="mt-1 text-2xl font-black">{row?.total ?? 0}</dd>
                  {row?.lastAt ? (
                    <dd className="text-xs text-fg-muted">
                      {dict.portal.settings.mail.lastAt} {formatDate("pt", new Date(row.lastAt), { dateStyle: "short", timeStyle: "short" })}
                    </dd>
                  ) : null}
                </div>
              );
            })}
          </dl>
          <div className="mt-4">
            <DispatchMailForm dict={dict.portal} />
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="rounded-xl border border-line bg-surface p-6" aria-labelledby="obs-title">
          <h2 id="obs-title" className="text-lg font-bold">{dict.portal.settings.observability.title}</h2>
          <p className="mt-1 text-sm text-fg-muted">{dict.portal.settings.observability.help}</p>
          <p className={`mt-3 text-sm font-bold ${sinkConfigured ? "text-success" : "text-warning"}`}>
            {sinkConfigured ? dict.portal.settings.observability.configured : dict.portal.settings.observability.notConfigured}
          </p>
          <div className="mt-4">
            <SinkTestForm dict={dict.portal} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
