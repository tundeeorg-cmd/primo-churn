import type { Locale } from "./index";

/**
 * THB currency formatting (i18n Step 5): th-TH's native currency
 * formatter in Thai, en-US digits with a manual ฿ prefix in English
 * (matches the formatting already used throughout the dashboard).
 */
export function formatThb(amount: number, locale: Locale): string {
  if (locale === "th") {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;
}

/** Compact THB formatting for KPI tiles (e.g. ฿1.2M). */
export function formatThbCompact(amount: number, locale: Locale): string {
  if (locale === "th") {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return `฿${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount)}`;
}

/** Plain count formatting, explicit per-locale rather than relying on the runtime's default locale. */
export function formatCount(value: number, locale: Locale): string {
  return value.toLocaleString(locale === "th" ? "th-TH" : "en-US");
}

/**
 * Date formatting — GREGORIAN calendar in both languages, deliberately.
 * th-TH defaults to the Buddhist Era (2569, not 2026) unless the Gregorian
 * calendar is explicitly requested via the -u-ca-gregory extension; a BE
 * year in a business dashboard reads as a bug to half the audience, so we
 * opt out of the locale default rather than opt into it. No current
 * component displays a date yet (Metrics.generated_at/train_cutoff/
 * test_cutoff aren't rendered anywhere in the dashboard today) — this
 * exists so the correct behavior is one call away when that changes.
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const intlLocale = locale === "th" ? "th-TH-u-ca-gregory" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
