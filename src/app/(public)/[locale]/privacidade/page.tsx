import type { Metadata } from "next";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { LinkButton } from "@/components/ui/LinkButton";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate } from "@/i18n/format";
import { publicPageMetadata } from "@/i18n/metadata";

const PATH = "/privacidade";
/** Data da última revisão do texto (muda junto com o conteúdo desta página). */
const UPDATED_AT = "2026-09-22";
const GOOGLE_PRIVACY = "https://policies.google.com/privacy";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacidade">): Promise<Metadata> {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  return publicPageMetadata(l, PATH, { title: dict.pages.privacy.title, description: dict.pages.privacy.description });
}

/**
 * Aviso de privacidade (21, 35): descreve o que o sistema realmente faz — o que
 * é observável no código — e marca como `[CONTEÚDO PENDENTE]` o que depende de
 * definição institucional (responsável, canal do titular e prazos de retenção).
 * Nada de promessa jurídica que a coordenação não aprovou.
 */
export default async function PrivacidadePage({ params }: PageProps<"/[locale]/privacidade">) {
  const { locale } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage dict={dict} path={PATH} />;
  const p = dict.privacy;
  const s = p.sections;
  // Só a seção de vídeos tem link externo; o tipo torna isso explícito.
  const order: Array<{ title: string; body: string; linkLabel?: string }> = [
    s.visitor, s.cookies, s.videos, s.photos, s.challenges, s.portal, s.where, s.rights, s.retention, s.controller,
  ];

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <SectionHeading as="h1" eyebrow={dict.pages.privacy.title} title={p.title} description={p.description} />

        <p className="mt-6 text-sm text-fg-muted">
          {p.updatedLabel} <time dateTime={UPDATED_AT}>{formatDate(l, new Date(`${UPDATED_AT}T12:00:00Z`), { dateStyle: "long" })}</time>
        </p>

        <p className="mt-4 rounded-2xl border border-warning bg-surface p-4 text-sm text-fg-muted" data-privacy-pending>
          {p.pendingNote}
        </p>

        <div className="mt-10 flex flex-col gap-8" data-reveal-group>
          {order.map((section) => (
            <section key={section.title} className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <p className="mt-3 text-fg-muted">{section.body}</p>
              {section.linkLabel && (
                <p className="mt-3">
                  <a
                    href={GOOGLE_PRIVACY}
                    target="_blank"
                    rel="noopener"
                    className="rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {section.linkLabel} ↗
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10">
          <LinkButton href={localizePath(l, "/")} variant="secondary">
            ← {dict.nav.home}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
