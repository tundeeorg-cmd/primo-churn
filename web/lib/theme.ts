/**
 * Segment -> colour mapping, shared by every chart on the dashboard.
 * Deliberately identical to src/segment.py's SEGMENT_COLORS so the same
 * segment reads as the same colour whether you're looking at a Python
 * figure in the deck or the live dashboard.
 */
export const SEGMENT_COLORS: Record<string, string> = {
  Champions: "#1f3b57", // navy
  Loyal: "#2e8b7a", // teal
  "At-risk regulars": "#d4a03c", // gold
  Hibernating: "#d65c4a", // coral
  "One-and-done": "#5b7c99", // slate
};

export const SEGMENT_ORDER = [
  "Champions",
  "Loyal",
  "At-risk regulars",
  "Hibernating",
  "One-and-done",
];

export function segmentColor(segment: string): string {
  return SEGMENT_COLORS[segment] ?? "#5b7c99";
}

/**
 * Risk-badge colour within the at-risk table. Every row here already
 * cleared the model's chosen threshold (Part F: "flagged" means
 * churn_probability >= that value) — this bucketing is a second,
 * finer-grained cue on top of that, not a re-application of the model's
 * own decision boundary. Gold = risk emphasis, coral = highest alarm
 * (PROJECT_BRIEF.md Prompt 11's colour rule) — never used decoratively.
 */
export function riskBadge(probability: number): {
  label: string;
  color: string;
} {
  if (probability >= 0.9) return { label: "Very high", color: "#d65c4a" };
  if (probability >= 0.8) return { label: "High", color: "#d4a03c" };
  return { label: "Elevated", color: "#5b7c99" };
}
