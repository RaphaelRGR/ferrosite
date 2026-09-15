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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1>{dict.states.notFoundTitle}</h1>
      <p className="mt-2">{dict.states.notFoundDescription}</p>
      <LinkButton href={localizePath(locale, "/")} variant="secondary" className="mt-6">
        {dict.states.backHome}
      </LinkButton>
      {/* TODO(DS-001+): design da página 404 */}
    </div>
  );
}
