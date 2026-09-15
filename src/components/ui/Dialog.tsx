"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export interface DialogProps {
  open: boolean;
  /** Chamado ao fechar por Escape, clique no backdrop ou controle interno. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Classes do painel (largura, padding etc.). */
  className?: string;
}

/**
 * Diálogo modal sobre <dialog>.showModal(): o navegador entrega foco inicial,
 * trap, Escape, inert do fundo e retorno de foco ao elemento que abriu (07/23).
 * Aqui só sincronizamos o estado React, travamos o scroll e rotulamos.
 */
export function Dialog({ open, onClose, title, description, children, className = "" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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

  // showModal torna o resto inerte, mas Tab no último controle ainda sai para a UI
  // do navegador; o padrão APG de diálogo modal espera que o foco dê a volta.
  const wrapFocus = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = Array.from(
      ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onKeyDown={wrapFocus}
      onClick={(e) => {
        // Clique no backdrop (o próprio <dialog>), não no painel.
        if (e.target === e.currentTarget) onClose();
      }}
      className={
        "m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl " +
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      }
    >
      <div className={`p-6 sm:p-8 ${className}`}>
        <h2 id={titleId} className="text-2xl font-bold leading-tight">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-fg-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}
