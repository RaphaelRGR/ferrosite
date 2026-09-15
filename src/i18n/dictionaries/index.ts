import type { Locale } from "../config";
import { en } from "./en";
import { pt, type Dictionary } from "./pt";

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };

/** Catálogo tipado do locale. Síncrono: os catálogos são pequenos módulos TS. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
