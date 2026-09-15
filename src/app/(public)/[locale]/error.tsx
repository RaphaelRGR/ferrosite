"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { reportClientError } from "@/lib/observability/client";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Erro do site público: mantém o shell e oferece nova tentativa.
 * Client Component: lê o locale de useParams (root-params não roda no cliente).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale: string }>();
  const dict = getDictionary(hasLocale(params.locale) ? params.locale : DEFAULT_LOCALE);

  useEffect(() => {
    reportClientError("public", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1>{dict.states.errorTitle}</h1>
      <Button className="mt-4" onClick={() => reset()}>
        {dict.states.retry}
      </Button>
    </div>
  );
}
