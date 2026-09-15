import { LOCALE_TAGS, type Locale } from "./config";

/**
 * Formatação via Intl (24): nunca concatenar/formatar à mão.
 * Datas devem chegar em UTC; o timezone institucional é aplicado aqui.
 */
export const INSTITUTIONAL_TIME_ZONE = "America/Sao_Paulo";

const COMPONENT_KEYS: Array<keyof Intl.DateTimeFormatOptions> = ["weekday", "era", "year", "month", "day", "hour", "minute", "second", "fractionalSecondDigits"];

export function formatDate(locale: Locale, date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  // dateStyle não pode coexistir com componentes (day/month/…): o default só entra quando nenhum foi pedido.
  const hasComponents = COMPONENT_KEYS.some((k) => k in options);
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    ...(hasComponents || options.dateStyle || options.timeStyle ? {} : { dateStyle: "long" }),
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
