import { th } from "./th";

/**
 * English dictionary. Typed against `keyof typeof th` so a key missing (or
 * extra) here fails `next build` — that's the enforcement mechanism for
 * Step 7's "th.ts and en.ts must have identical key sets" requirement.
 */
export const en: Record<keyof typeof th, string> = {
  "brand.overline": "PRIMO Churn Radar",
  "brand.dashboardTitle": "Oberry Member Retention Radar",

  "dashboard.subtitle":
    "Members who need attention today, ranked by how much is riding on getting to them first.",
  "dashboard.updatedDaily": "Updated daily",
  "dashboard.footerNote":
    "Illustrative figures · synthetic data. Oberry is a fictional café chain used to demonstrate PRIMO's churn-prediction engine.",

  "kpi.activeMembers": "Active members",
  "kpi.flaggedAtRisk": "Flagged at-risk",
  "kpi.flaggedCaptionFiltered": "matching current filters",
  "kpi.flaggedCaptionThreshold": "at the model's chosen threshold",
  "kpi.revenueAtRisk": "Revenue at risk (30d)",
  "kpi.revenueAtRiskCaption": "trailing-12mo spend of flagged members ÷ 12",
  "kpi.modelRecall": "Model recall",
  "kpi.modelRecallCaption": "at {precision}% precision",

  "table.emptyTitle": "No members match these filters",
  "table.emptyBody": "Try lowering the risk threshold, or clear a segment/tier filter above.",
  "table.colMember": "Member",
  "table.colValueAtRisk": "Value at risk",

  "common.segment": "Segment",
  "common.tier": "Tier",
  "common.risk": "Risk",
  "common.members": "members",

  "controls.filters": "Filters",
  "controls.clearFilters": "Clear filters",
  "controls.minRiskToFlag": "Minimum risk to flag",
  "controls.meetBar": "{visible} of {total} flagged members meet this bar.",

  "chart.heading": "Members by segment — {count} members",

  "detail.emptyTitle": "Select a member",
  "detail.emptyBody": "Pick anyone from the list to see why they're at risk and what to do about it.",
  "detail.whyAtRisk": "Why they're at risk",
  "detail.churnProbability": "Churn probability",
  "detail.valueProtected": "Estimated value protected",
  "detail.englishOriginalNote": "(original English)",
  "action.recommended": "Recommended action",

  "risk.low": "Low",
  "risk.medium": "Medium",
  "risk.high": "High",
  "risk.veryHigh": "Very high",

  "segment.champions": "Champions",
  "segment.loyal": "Loyal",
  "segment.atRiskRegulars": "At-risk regulars",
  "segment.hibernating": "Hibernating",
  "segment.oneAndDone": "One-and-done",

  "action.champions": "VIP perks, early access to new drinks, referral ask",
  "action.loyal": "Tier-up nudge, personalized bundle",
  "action.atRiskRegulars": '15%-off win-back coupon + "we miss you" LINE mission',
  "action.hibernating": "Bounce-back free drink + one-question why-survey",
  "action.oneAndDone": "Onboarding mission, second-visit nudge",

  "kpi.daysSinceLastActivity": "Days since last activity",
  "action.launchCampaign": "Launch campaign",
};
