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

  "footer.syntheticNote":
    "Illustrative figures · synthetic data. Oberry is a fictional café chain used to demonstrate PRIMO's churn-prediction engine.",
  "footer.sourceOnGithub": "Source on GitHub",

  "nav.openRadar": "Open the Radar",

  "kpi.activeMembers": "Active members",
  "kpi.flaggedAtRisk": "Flagged at-risk",
  "kpi.flaggedCaptionFiltered": "matching current filters",
  "kpi.flaggedCaptionThreshold": "at the model's chosen threshold",
  "kpi.revenueAtRisk": "Revenue at risk (30d)",
  "kpi.revenueAtRiskCaption": "trailing-12mo spend of flagged members ÷ 12",
  "kpi.modelRecall": "Model recall",
  "kpi.modelRecallCaption": "at {precision}% precision",

  "table.emptyTitle": "No members match these filters",
  "table.emptyBody":
    "Try lowering the risk threshold, or clear a segment/tier filter above.",
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
  "detail.emptyBody":
    "Pick anyone from the list to see why they're at risk and what to do about it.",
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
  "action.atRiskRegulars":
    '15%-off win-back coupon + "we miss you" LINE mission',
  "action.hibernating": "Bounce-back free drink + one-question why-survey",
  "action.oneAndDone": "Onboarding mission, second-visit nudge",

  "kpi.daysSinceLastActivity": "Days since last activity",
  "action.launchCampaign": "Launch campaign",

  // ═══════════════════════════════════════════════════════════════════════
  // Landing page (/) — Part A1
  // ═══════════════════════════════════════════════════════════════════════

  "hero.headline": "Who's about to leave?",
  "hero.narrativeStory":
    "A member came in every Tuesday for eight months. Then Tuesday became Thursday. Then once every other week. Then nothing — sixty quiet days before anyone at Oberry noticed she was gone.",
  "hero.narrativeConclusion":
    "That widening gap is the signal this whole system exists to catch, weeks before the last visit — not a sudden drop, and not a big number with a gradient behind it.",
  "hero.sparklineAriaLabel":
    "A sequence of visits spaced closely together, then widening, then a long gap of silence",
  "hero.sixtyDaysSilent": "60 days silent",

  "problem.heading": "The quiet problem in every loyalty program",
  "problem.para1":
    "“Churn” just means a member who used to come back regularly has stopped — no cancellation, no complaint, nothing dramatic. For a café chain built on repeat visits, that's the entire business model quietly leaking away, one person at a time, with no alarm going off anywhere.",
  "problem.para2":
    "The trouble is timing. By the time an operator notices a regular hasn't been in for two months, winning them back is far more expensive than it would have been to reach out while they were merely drifting. A prediction system flips that around: it watches the early signs — visits spacing out, spending trailing off — and flags a member while there's still time to do something about it.",

  "howItWorks.heading": "How it works",
  "pipeline.01.title": "Learn from two years of visits",
  "pipeline.01.body":
    "Every purchase, branch, and point redemption across roughly 20,000 members feeds the model — 24 months of the ordinary rhythm of a café chain.",
  "pipeline.02.title": "Turn history into signals",
  "pipeline.02.body":
    "Recency, spending trend, visit-gap trend, redemption habits — all computed as of one fixed date, with an explicit check that nothing from after that date leaks in.",
  "pipeline.03.title": "Group members by behavior",
  "pipeline.03.body":
    "Unsupervised clustering finds five natural groups on its own, from Champions to members who are already fading — never hand-picked cluster numbers.",
  "pipeline.04.title": "Score who's likely to leave",
  "pipeline.04.body":
    "A model trained on an earlier period is tested on a later one it has never seen, and ranks every member by how likely they are to go quiet.",
  "pipeline.05.title": "Recommend what to do about it",
  "pipeline.05.body":
    "Each flagged member gets a plain-English reason and a specific next step — not just a risk percentage sitting in a spreadsheet.",

  "results.heading": "Results",
  "results.bubble.alt":
    "Bubble chart of five member segments positioned by recency and visit frequency, sized by mean spend",
  "results.bubble.caption":
    "Members split into five natural groups — a handful of big-spending Champions, a broad base of Loyal regulars, and a slice already gone quiet.",
  "results.tierRedemption.alt":
    "Two bar charts showing churn rate by loyalty tier and by whether a member ever redeemed points",
  "results.tierRedemption.caption":
    "Gold members leave far less often than Bronze — and members who never once redeemed a point churn noticeably more than those who did.",
  "results.confusionMatrix.alt":
    "Confusion matrix labeled true stay, false alarm, missed churn, and caught churn",
  "results.confusionMatrix.caption":
    "The model catches most departing members before they're gone, at the cost of a manageable number of false alarms — never a perfect score, always an honest one.",
  "results.decileLift.alt":
    "Decile lift chart showing actual churn rate and revenue at risk, concentrated in the highest-risk decile",
  "results.decileLift.caption":
    "The riskiest 10% of members account for a wildly disproportionate share of the revenue on the line — that's where outreach should start first.",

  "recommends.heading": "What it recommends",
  "recommends.intro":
    "Every flagged member's segment maps to a specific campaign — not a generic “reach out,” but a next step sized to how urgent and how valuable that member actually is.",
  "recommends.colTypicalRisk": "Typical risk",
  "action.riskLow": "low",
  "action.riskLowMed": "low–med",
  "action.riskHigh": "high",
  "action.riskVeryHigh": "very high",

  "stats.churnRate": "Churn rate",

  "footer.brandTagline":
    "Churn prediction & member segmentation for loyalty programs.",
  "footer.stackTitle": "Built with",
  "footer.linksTitle": "Links",
};
