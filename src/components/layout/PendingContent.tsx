import { LinkButton } from "@/components/ui/LinkButton";
import { localizePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Indisponibilidade explícita de conteúdo por locale (24: nunca usar PT como
 * fallback invisível em página EN). Some quando o conteúdo editorial for
 * publicado por locale (BASE-002 / PUBLIC-001 / PUB-001).
 */
export function PendingPage({ dict, path }: { dict: Pick<Dictionary, "pending">; path: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 pt-32 pb-20 text-center">
      <h1 className="text-3xl font-black sm:text-4xl">{dict.pending.pageTitle}</h1>
      <p className="text-fg-muted">{dict.pending.pageDescription}</p>
      <LinkButton href={localizePath("pt", path)} variant="secondary" hrefLang="pt-BR">
        {dict.pending.viewInOtherLocale}
      </LinkButton>
    </div>
  );
}

/** Bloco honesto para quando todo o conteúdo de uma página ainda aguarda validação (modo strict). */
export function EditorialPending({ dict }: { dict: Pick<Dictionary, "pending"> }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6" data-editorial-pending>
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-10">
        <h2 className="text-xl font-bold">{dict.pending.editorialTitle}</h2>
        <p className="mt-2 text-fg-muted">{dict.pending.editorialDescription}</p>
      </div>
    </section>
  );
}

export function PendingSection({ dict }: { dict: Pick<Dictionary, "pending"> }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10">
        <h2 className="text-xl font-bold">{dict.pending.title}</h2>
        <p className="mt-2 text-fg-muted">{dict.pending.description}</p>
      </div>
    </section>
  );
}
