"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, type NavItem } from "@/lib/portal/navigation";

/**
 * Lista de navegação do Portal (usada na sidebar e no drawer). Item ativo tem
 * barra + ícone + rótulo, não só cor (06A).
 */
export function PortalNav({ items, label, onNavigate }: { items: NavItem[]; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              active ? "bg-surface-2 text-link" : "text-fg-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            {active && <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-action" />}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
