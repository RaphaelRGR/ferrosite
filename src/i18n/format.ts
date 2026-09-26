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

/** Data civil "YYYY-MM-DD" no fuso do curso (chaves de período, semana, filtros). */
export function institutionalDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: INSTITUTIONAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Valor de `<input type="datetime-local">` ("YYYY-MM-DDTHH:mm") no fuso do curso. */
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: INSTITUTIONAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function formatList(locale: Locale, items: string[]): string {
  return new Intl.ListFormat(LOCALE_TAGS[locale], { style: "long", type: "conjunction" }).format(items);
}
