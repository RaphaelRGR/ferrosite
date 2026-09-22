import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Cabeçalho editorial de seção (guia §2.4): eyebrow com traço laranja,
 * título, descrição curta e link de continuação opcional.
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
    <div data-reveal className={`flex flex-col gap-3 ${align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className={`max-w-2xl ${align === "center" ? "text-center" : ""}`}>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-link">
            <span aria-hidden="true" className="rail-mark h-0.5 w-6 rounded-full bg-action" />
            {eyebrow}
          </p>
        )}
        <Heading className={`font-black tracking-tight ${Heading === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}>
          {title}
        </Heading>
        {description && <p className="mt-2 text-base text-fg-muted sm:text-lg">{description}</p>}
        {children}
      </div>
      {link && (
        <Link
          href={link.href}
          className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {link.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
