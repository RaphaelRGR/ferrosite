import { LOCALE_TAGS, type Locale } from "./config";

/**
 * Formatação via Intl (24): nunca concatenar/formatar à mão.
 * Datas devem chegar em UTC; o timezone institucional é aplicado aqui.
 */
export const INSTITUTIONAL_TIME_ZONE = "America/Sao_Paulo";

export function formatDate(locale: Locale, date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    dateStyle: "long",
    timeZone: INSTITUTIONAL_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value);
}

export function formatList(locale: Locale, items: string[]): string {
  return new Intl.ListFormat(LOCALE_TAGS[locale], { style: "long", type: "conjunction" }).format(items);
}
