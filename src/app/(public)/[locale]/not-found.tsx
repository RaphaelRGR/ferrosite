import { locale as rootLocale } from "next/root-params";
import { LinkButton } from "@/components/ui/LinkButton";
import { DEFAULT_LOCALE, hasLocale, localizePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * 404 localizada, dentro do shell público (renderizada pelo catch-all [...rest]).
 */
export default async function NotFound() {
  const current = await rootLocale();
  const locale = hasLocale(current) ? current : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">404</p>
      <h1 className="text-3xl font-black sm:text-4xl">{dict.states.notFoundTitle}</h1>
      <p className="text-fg-muted">{dict.states.notFoundDescription}</p>
      <LinkButton href={localizePath(locale, "/")} variant="secondary" className="mt-2">
        {dict.states.backHome}
      </LinkButton>
    </div>
  );
}
