"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Drawer } from "@/components/ui/Drawer";
import type { NavItem } from "@/lib/portal/navigation";
import { PortalNav } from "./PortalNav";

/** Botão hambúrguer + drawer com a mesma navegação da sidebar (08). */
export function MobileNav({ items, labels }: { items: NavItem[]; labels: { menu: string; open: string; close: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-haspopup="dialog"
        className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-surface text-fg hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={labels.menu}>
        <div className="flex items-center justify-between border-b border-line p-4">
          <BrandLogo width={56} className="p-1" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="inline-flex size-11 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <PortalNav items={items} label={labels.menu} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>
    </>
  );
}
