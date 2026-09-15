import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnverifiedContent } from "@/components/content/UnverifiedContent";
import { PendingPage } from "@/components/layout/PendingContent";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { EXPERIENCES } from "@/content/staging";
import { DEFAULT_LOCALE, hasLocale, LOCALES, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { publicPageMetadata } from "@/i18n/metadata";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => EXPERIENCES.map((e) => ({ locale, id: e.id })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/experiencias/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const item = EXPERIENCES.find((e) => e.id === id);
  return item ? publicPageMetadata(l, `/experiencias/${id}`, { title: item.title, description: item.description }) : {};
}

/** Detalhe de experiência: destino, data, objetivo (staging) + campos pendentes explícitos. */
export default async function ExperienciaPage({ params }: PageProps<"/[locale]/experiencias/[id]">) {
  const { locale, id } = await params;
  const l = hasLocale(locale) ? locale : DEFAULT_LOCALE;
  const item = EXPERIENCES.find((e) => e.id === id);
  if (!item) notFound();
  const dict = getDictionary(l);
  if (l !== "pt") return <PendingPage locale={l} dict={dict} path={`/experiencias/${id}`} />;

  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <UnverifiedContent section="experiencias.detalhe">
          <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.scope === "internacional" ? "info" : "neutral"}>{item.scope === "internacional" ? dict.experiences.international : dict.experiences.brazil}</Badge>
              <span className="text-xs font-bold uppercase tracking-widest text-fg-muted">{item.when} · {item.meta}</span>
            </div>
            <div className="mt-4">
              <SectionHeading as="h1" eyebrow={dict.experiences.eyebrow} title={item.title} description={item.description} />
            </div>
            <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-canvas p-6">
              <p className="font-bold">{dict.pending.title}</p>
              <p className="mt-1 text-sm text-fg-muted">{dict.experiences.pendingDetail}</p>
            </div>
            <div className="mt-8">
              <LinkButton href={localizePath(l, "/experiencias")} variant="secondary">
                ← {dict.experiences.back}
              </LinkButton>
            </div>
          </div>
        </UnverifiedContent>
      </div>
    </section>
  );
}
