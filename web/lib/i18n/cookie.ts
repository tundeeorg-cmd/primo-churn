import type { Locale } from "./index";

// Client-safe only — no next/headers import here. LanguageProvider.tsx
// (a Client Component) imports setClientLocaleCookie from this file, and
// bundlers pull in a module's full import graph, so next/headers (server
// Server-Component-only) must live in a separate file — see server.ts.

export const LOCALE_COOKIE_NAME = "locale";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined): value is Locale {
  return value === "th" || value === "en";
}

/** Client-side write — called by LanguageProvider when the user switches. */
export function setClientLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
