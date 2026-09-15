import type { ReactNode } from "react";

/** Estado vazio que explica o porquê e oferece a próxima ação permitida (07). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <p className="text-base font-bold text-fg">{title}</p>
      <p className="max-w-prose text-sm text-fg-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
