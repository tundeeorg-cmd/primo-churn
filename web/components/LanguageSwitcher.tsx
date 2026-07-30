"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";

/**
 * "ไทย" / "EN" — not a flag icon (flags map to countries, not languages).
 * These two labels are locale-invariant control chrome, not page content —
 * both are always shown regardless of which is active, so they're not
 * routed through the t() dictionary (there's no "translation" happening).
 */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-line bg-paper p-0.5 shrink-0"
    >
      <button
        type="button"
        onClick={() => setLocale("th")}
        aria-pressed={locale === "th"}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
          locale === "th" ? "bg-navy text-white" : "text-ink-muted hover:text-navy"
        }`}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
          locale === "en" ? "bg-navy text-white" : "text-ink-muted hover:text-navy"
        }`}
      >
        EN
      </button>
    </div>
  );
}
