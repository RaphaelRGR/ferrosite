import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cabeçalho editorial de seção (guia §2.4, DESIGN-D): rótulo de contexto opcional com o traço de
 * trilho (só quando informa algo que o título não diz), título, descrição curta e link de continuação.
 * Tamanhos fluidos (`t-title` na página, `t-section` na seção) vêm de layout/public-theme.css.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  link,
  as: Heading = "h2",
  align = "left",
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { href: string; label: string };
  as?: "h1" | "h2";
  align?: "left" | "center";
  children?: ReactNode;
}) {
  return (
    <div data-reveal className={`flex flex-col gap-4 ${align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className={`max-w-3xl ${align === "center" ? "text-center" : ""}`}>
        {eyebrow && (
          <p className={`eyebrow mb-3 ${align === "center" ? "justify-center" : ""}`}>
            <span aria-hidden="true" className="rail-mark h-0.5 w-6 rounded-full bg-action" />
            {eyebrow}
          </p>
        )}
        <Heading className={`font-black ${Heading === "h1" ? "t-title" : "t-section"}`}>{title}</Heading>
        {description && <p className="t-lead mt-3 max-w-[65ch] text-fg-muted">{description}</p>}
        {children}
      </div>
      {link && (
        <Link
          href={link.href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded text-[15px] font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {link.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
