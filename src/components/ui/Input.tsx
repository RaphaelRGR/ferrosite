"use client";

import { useId, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  help?: string;
  error?: string;
}

/**
 * Campo de texto com label persistente, ajuda e erro textual associados por
 * aria-describedby; `required` é anunciado e sinalizado no rótulo.
 */
export function Input({ label, help, error, id, required, className = "", ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-bold text-fg">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        className={
          "min-h-11 rounded-lg border bg-surface px-3 text-base text-fg placeholder:text-fg-muted " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
          "disabled:opacity-50 " +
          (error ? "border-danger" : "border-line-strong")
        }
        {...rest}
      />
      {help && (
        <p id={helpId} className="text-xs text-fg-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-bold text-danger">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
            <path d="M12 3 2 21h20L12 3Zm0 7v5m0 3h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
