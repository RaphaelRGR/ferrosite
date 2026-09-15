"use client";

import { useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const CONTROL =
  "min-h-11 rounded-lg border bg-surface px-3 text-base text-fg placeholder:text-fg-muted " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 ";

function Wrapper({ id, label, help, error, required, className, children }: { id: string; label: string; help?: string; error?: string; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="text-sm font-bold text-fg">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-xs text-fg-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  help?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

/** Select nativo com label/ajuda/erro associados (mesmo contrato do Input). */
export function Select({ label, help, error, id, required, className = "", options, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <Wrapper id={selectId} label={label} help={help} error={error} required={required} className={className}>
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[help && `${selectId}-help`, error && `${selectId}-error`].filter(Boolean).join(" ") || undefined}
        className={CONTROL + (error ? "border-danger" : "border-line-strong")}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  help?: string;
  error?: string;
}

export function Textarea({ label, help, error, id, required, className = "", ...rest }: TextareaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <Wrapper id={areaId} label={label} help={help} error={error} required={required} className={className}>
      <textarea
        id={areaId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[help && `${areaId}-help`, error && `${areaId}-error`].filter(Boolean).join(" ") || undefined}
        className={CONTROL + "py-2 " + (error ? "border-danger" : "border-line-strong")}
        rows={4}
        {...rest}
      />
    </Wrapper>
  );
}
