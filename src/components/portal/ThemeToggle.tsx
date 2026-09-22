"use client";

import { useEffect, useState, useTransition } from "react";
import { setThemePreference } from "@/lib/portal/actions";
import { THEMES, type ThemePreference } from "@/lib/portal/theme";

/**
 * Seletor Claro/Escuro/Sistema. Aplica no <html> imediatamente (sem reload,
 * sem perda de formulário) e persiste via Server Action (cookie + conta).
 */
export function ThemeToggle({
  initial,
  labels,
}: {
  initial: ThemePreference;
  labels: { label: string; light: string; dark: string; system: string };
}) {
  const [theme, setTheme] = useState<ThemePreference>(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const choose = (next: ThemePreference) => {
    setTheme(next);
    startTransition(() => setThemePreference(next));
  };

  return (
    <fieldset className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 sm:gap-1 sm:p-1" aria-busy={pending || undefined}>
      <legend className="sr-only">{labels.label}</legend>
      {THEMES.map((value) => (
        <label
          key={value}
          className={`cursor-pointer rounded-full px-1.5 py-1.5 text-xs font-bold transition-colors focus-within:ring-2 focus-within:ring-focus sm:px-3 ${
            theme === value ? "bg-action text-fg-on-action" : "text-fg-muted hover:text-fg"
          }`}
        >
          <input
            type="radio"
            name="theme"
            value={value}
            checked={theme === value}
            onChange={() => choose(value)}
            className="sr-only"
          />
          {labels[value]}
        </label>
      ))}
    </fieldset>
  );
}
