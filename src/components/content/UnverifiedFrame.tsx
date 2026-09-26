"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Moldura com o selo "Conteúdo em verificação" (BASE-002). Só é montada pelo
 * servidor quando a seção pode aparecer (modo review); é client apenas para
 * ler o locale do selo via useParams. Não decide nada sobre visibilidade.
 */
export function UnverifiedFrame({
  section,
  children,
  badgePosition = "top-right",
}: {
  section: string;
  children: ReactNode;
  badgePosition?: "top-right" | "bottom-left";
}) {
  const params = useParams<{ locale?: string }>();
  const locale = hasLocale(params?.locale) ? params.locale : DEFAULT_LOCALE;
  const dict = getDictionary(locale).quarantine;
  // No celular o selo fica "pendurado" na borda superior (não cobre o título, que ocupa a largura toda); de sm em diante, dentro do canto.
  const position = badgePosition === "top-right" ? "-top-3 right-3 sm:top-4 sm:right-4" : "-bottom-3 left-3 sm:bottom-4 sm:left-4";

  return (
    <div className="relative" data-content-status="unverified" data-content-section={section}>
      {children}
      <p
        className={`pointer-events-auto absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-warning bg-surface px-2.5 py-1 text-[11px] font-bold text-warning ${position}`}
        title={dict.explanation}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
          <path d="M12 3 2 21h20L12 3Zm0 7v5m0 3h.01" />
        </svg>
        {dict.badge}
        <span className="sr-only">. {dict.explanation}</span>
      </p>
    </div>
  );
}
