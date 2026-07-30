/**
 * Display-layer lookups from raw Supabase/enum values to translated labels.
 *
 * IMPORTANT (PROJECT_BRIEF.md i18n Step 2): these functions are read-only
 * translations for rendering. They never touch the underlying value —
 * filtering, sorting, and Set membership (activeSegments.has(m.segment),
 * SEGMENT_ORDER, Recharts dataKey, etc.) must keep comparing the raw
 * English string from Supabase / src/segment.py. Only wrap the JSX text
 * node with these, never the value itself.
 */
import type { Locale } from "./index";
import { t } from "./index";

const SEGMENT_KEYS = {
  Champions: "segment.champions",
  Loyal: "segment.loyal",
  "At-risk regulars": "segment.atRiskRegulars",
  Hibernating: "segment.hibernating",
  "One-and-done": "segment.oneAndDone",
} as const;

/** Segment display name. Falls back to the raw value for an unknown segment. */
export function segmentLabel(segment: string, locale: Locale): string {
  const key = SEGMENT_KEYS[segment as keyof typeof SEGMENT_KEYS];
  return key ? t(locale, key) : segment;
}

/**
 * Loyalty tiers (Bronze/Silver/Gold) are kept in Latin script in both
 * locales — decision C, same treatment as brand names. This function
 * exists so call sites don't special-case tier vs. segment rendering.
 */
export function tierLabel(tier: string): string {
  return tier;
}

const ACTION_KEYS = {
  Champions: "action.champions",
  Loyal: "action.loyal",
  "At-risk regulars": "action.atRiskRegulars",
  Hibernating: "action.hibernating",
  "One-and-done": "action.oneAndDone",
} as const;

/**
 * Recommended-action translation, keyed by the member's `segment` field
 * (a clean enum) rather than by matching `recommended_action`'s English
 * sentence text — recommend.py's segment -> action mapping is 1:1, and
 * every at_risk_members row already carries both fields, so this avoids
 * the fragility of string-matching free text that could drift from the
 * Python wording. Falls back to the raw English sentence from Supabase
 * for an unrecognized segment, rather than showing nothing.
 */
export function actionLabel(segment: string, rawAction: string, locale: Locale): string {
  const key = ACTION_KEYS[segment as keyof typeof ACTION_KEYS];
  return key ? t(locale, key) : rawAction;
}

const RISK_LEVEL_KEYS = {
  Low: "risk.low",
  // lib/theme.ts's riskBadge() calls this bucket "Elevated" — decision D
  // maps it to the glossary's "Medium" level.
  Elevated: "risk.medium",
  High: "risk.high",
  "Very high": "risk.veryHigh",
} as const;

/** Risk-badge level translation (lib/theme.ts's riskBadge().label values). */
export function riskLevelLabel(rawLabel: string, locale: Locale): string {
  const key = RISK_LEVEL_KEYS[rawLabel as keyof typeof RISK_LEVEL_KEYS];
  return key ? t(locale, key) : rawLabel;
}
