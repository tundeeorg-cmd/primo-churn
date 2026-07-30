import { en } from "./en";
import { th } from "./th";

export type Locale = "th" | "en";

export const dictionaries: Record<Locale, Record<keyof typeof th, string>> = { th, en };

export type TranslationKey = keyof typeof th;

/**
 * Returns the key itself if a translation is missing, so gaps are visible
 * (a raw "kpi.activeMembers" on screen) rather than silently blank.
 */
export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? key;
}

/** t() with {var} interpolation, for the handful of templated strings. */
export function tf(locale: Locale, key: TranslationKey, vars: Record<string, string | number>): string {
  let out = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export { th } from "./th";
export { en } from "./en";
