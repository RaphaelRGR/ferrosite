"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Painel lateral modal sobre <dialog>.showModal(): inert do fundo, Escape,
 * retorno de foco e wrap de Tab (mesmo contrato do Dialog). Usado pela
 * navegação móvel do Portal (08: drawer em tablet/smartphone).
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "left",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const wrapFocus = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = Array.from(
      ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={wrapFocus}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-0 h-full max-h-none w-80 max-w-[85vw] border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50 ${
        side === "left" ? "mr-auto border-r" : "ml-auto border-l"
      }`}
    >
      <div className="flex h-full flex-col">
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
