import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "text-fg-muted border-line-strong",
  success: "text-success border-success",
  warning: "text-warning border-warning",
  danger: "text-danger border-danger",
  info: "text-info border-info",
};

// Ícone por tom para que o status não dependa só da cor (23/31).
const ICONS: Record<BadgeTone, ReactNode> = {
  neutral: <circle cx="12" cy="12" r="4" />,
  success: <path d="m5 12 5 5L20 7" />,
  warning: <path d="M12 3 2 21h20L12 3Zm0 7v5m0 3h.01" />,
  danger: <path d="m6 6 12 12M18 6 6 18" />,
  info: <path d="M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-surface px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        {ICONS[tone]}
      </svg>
      {children}
    </span>
  );
}
