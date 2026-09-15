/**
 * Tema do Portal (06A): escolha explícita > sistema > claro. A escolha vive em
 * cookie (aplicada no <html> antes da hidratação — sem flash) e, quando há
 * banco, em user_preference. O site público não herda este tema.
 */
export const THEME_COOKIE = "portal-theme";
export const THEMES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEMES)[number];

export function parseTheme(value: string | undefined | null): ThemePreference {
  return THEMES.includes(value as ThemePreference) ? (value as ThemePreference) : "system";
}

/** Valor inicial de data-theme no servidor; "system" é resolvido por script inline antes da pintura. */
export function initialHtmlTheme(preference: ThemePreference): "light" | "dark" {
  return preference === "dark" ? "dark" : "light";
}

/** Script inline mínimo: aplica o tema do sistema antes da primeira pintura (06A). */
export const SYSTEM_THEME_SCRIPT =
  "try{if(matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark'}}catch(e){}";
