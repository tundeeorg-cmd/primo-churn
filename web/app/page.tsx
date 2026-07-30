import Image from "next/image";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getServerLocale } from "@/lib/i18n/server";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";
import { actionLabel, segmentLabel } from "@/lib/i18n/labels";
import { formatCount } from "@/lib/i18n/format";

const PIPELINE_STAGES = [
  { n: "01", titleKey: "pipeline.01.title", bodyKey: "pipeline.01.body" },
  { n: "02", titleKey: "pipeline.02.title", bodyKey: "pipeline.02.body" },
  { n: "03", titleKey: "pipeline.03.title", bodyKey: "pipeline.03.body" },
  { n: "04", titleKey: "pipeline.04.title", bodyKey: "pipeline.04.body" },
  { n: "05", titleKey: "pipeline.05.title", bodyKey: "pipeline.05.body" },
] satisfies Array<{ n: string; titleKey: TranslationKey; bodyKey: TranslationKey }>;

const RESULTS = [
  {
    src: "/figures/07_segment_bubble_chart.png",
    width: 1425,
    height: 1050,
    altKey: "results.bubble.alt",
    captionKey: "results.bubble.caption",
  },
  {
    src: "/figures/03_churn_by_tier_and_redemption.png",
    width: 1500,
    height: 675,
    altKey: "results.tierRedemption.alt",
    captionKey: "results.tierRedemption.caption",
  },
  {
    src: "/figures/10_confusion_matrix.png",
    width: 975,
    height: 900,
    altKey: "results.confusionMatrix.alt",
    captionKey: "results.confusionMatrix.caption",
  },
  {
    src: "/figures/11_decile_lift_chart.png",
    width: 1500,
    height: 825,
    altKey: "results.decileLift.alt",
    captionKey: "results.decileLift.caption",
  },
] satisfies Array<{ src: string; width: number; height: number; altKey: TranslationKey; captionKey: TranslationKey }>;

// Segment/risk stay the raw English enum values used elsewhere in the app
// (segment.py's cluster names, recommend.py's action lookup) — only the
// rendered label goes through segmentLabel()/actionLabel()/riskKey below.
// Not Supabase data (this table is static marketing copy), but kept
// consistent with the same enum vocabulary on purpose.
const ACTIONS = [
  { segment: "Champions", riskKey: "action.riskLow", action: "VIP perks, early access to new drinks, referral ask" },
  { segment: "Loyal", riskKey: "action.riskLowMed", action: "Tier-up nudge, personalized bundle" },
  {
    segment: "At-risk regulars",
    riskKey: "action.riskHigh",
    action: '15%-off win-back coupon + "we miss you" LINE mission',
  },
  {
    segment: "Hibernating",
    riskKey: "action.riskVeryHigh",
    action: "Bounce-back free drink + one-question why-survey",
  },
  { segment: "One-and-done", riskKey: "action.riskHigh", action: "Onboarding mission, second-visit nudge" },
] satisfies Array<{ segment: string; riskKey: TranslationKey; action: string }>;

const SEGMENT_DOT: Record<string, string> = {
  Champions: "#1f3b57",
  Loyal: "#2e8b7a",
  "At-risk regulars": "#d4a03c",
  Hibernating: "#d65c4a",
  "One-and-done": "#5b7c99",
};

// Built with — footer stack list. Kept in Latin script (glossary).
const STACK = ["Python", "XGBoost", "SHAP", "Supabase", "Next.js", "Vercel"];

export default async function Home() {
  const locale: Locale = await getServerLocale();
  const tr = (key: TranslationKey) => t(locale, key);

  // Verified against outputs/metrics.json before hardcoding (Part B1):
  // test_churn_rate ≈ 0.1929, model_recall ≈ 0.5722. Flagged count observed
  // live from Supabase during testing. Static like the rest of this page
  // (Prompt 13: "static content, no database calls") — the footer's
  // synthetic-data note already covers every number on this page.
  const heroStats = [
    { value: "19%", labelKey: "stats.churnRate" as TranslationKey },
    { value: "57%", labelKey: "kpi.modelRecall" as TranslationKey },
    { value: formatCount(2260, locale), labelKey: "kpi.flaggedAtRisk" as TranslationKey },
  ];

  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-navy">{tr("brand.overline")}</p>
          <LanguageSwitcher />
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-semibold text-navy leading-[1.05] mb-6 max-w-[16ch]">
          {tr("hero.headline")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center mb-10">
          <p className="text-lg text-ink leading-relaxed max-w-[52ch]">
            <em className="not-italic text-ink-muted">{tr("hero.narrativeStory")}</em>{" "}
            {tr("hero.narrativeConclusion")}
          </p>

          {/* Widening-gap sparkline — the one visual idea in this hero */}
          <svg
            viewBox="0 0 260 90"
            className="w-full max-w-[260px] shrink-0"
            role="img"
            aria-label={tr("hero.sparklineAriaLabel")}
          >
            <line x1="8" y1="45" x2="180" y2="45" stroke="#e4e1d8" strokeWidth="2" />
            <line
              x1="180"
              y1="45"
              x2="252"
              y2="45"
              stroke="#d65c4a"
              strokeWidth="2"
              strokeDasharray="4 5"
            />
            {[8, 34, 60, 86, 118, 156].map((x, i) => (
              <circle key={i} cx={x} cy={45} r={i < 4 ? 5 : 6} fill="#1f3b57" />
            ))}
            <circle cx={180} cy={45} r={6} fill="#d65c4a" />
            <text x="180" y="72" textAnchor="middle" className="fill-coral" fontSize="11" fontWeight="600">
              {tr("hero.sixtyDaysSilent")}
            </text>
          </svg>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-navy text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-navy-dark transition-colors motion-reduce:transition-none"
        >
          {tr("nav.openRadar")}
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* ── Stat trio — tundee.org's StatsBar pattern (Part B1) ────────────── */}
      <div className="bg-paper border-t border-b border-line">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-3 divide-x divide-line">
            {heroStats.map((stat) => (
              <div key={stat.labelKey} className="py-5 px-4 text-center">
                <div className="font-display text-2xl font-bold text-navy leading-none mb-1 tabular-figures">
                  {stat.value}
                </div>
                <div className="text-[13px] text-ink-muted leading-tight">{tr(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── The problem ──────────────────────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="max-w-[760px] mx-auto px-6 py-14 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-6">
            {tr("problem.heading")}
          </h2>
          <p className="text-ink leading-relaxed mb-4">{tr("problem.para1")}</p>
          <p className="text-ink leading-relaxed">{tr("problem.para2")}</p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-6 py-14 sm:py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-10">
          {tr("howItWorks.heading")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.n} className="rounded-xl border border-line bg-paper p-5">
              {/* tundee.org's thin, near-invisible step-number treatment
                  (Part B1), not Primo's original bold teal text-3xl */}
              <p className="text-[0.7rem] text-line tracking-[1px] mb-3">{stage.n}</p>
              <h3 className="font-semibold text-navy mb-2 leading-snug">{tr(stage.titleKey)}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{tr(stage.bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <section className="bg-paper border-y border-line">
        <div className="max-w-[1100px] mx-auto px-6 py-14 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-10">
            {tr("results.heading")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RESULTS.map((r) => (
              <figure key={r.src}>
                <div className="result-card-hover rounded-xl border border-line overflow-hidden bg-canvas">
                  <Image
                    src={r.src}
                    alt={tr(r.altKey)}
                    width={r.width}
                    height={r.height}
                    className="w-full h-auto"
                  />
                </div>
                <figcaption className="text-sm text-ink-muted leading-relaxed mt-3">
                  {tr(r.captionKey)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it recommends ──────────────────────────────────────────── */}
      <section className="max-w-[900px] mx-auto px-6 py-14 sm:py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-3">
          {tr("recommends.heading")}
        </h2>
        <p className="text-ink-muted mb-8 max-w-[60ch]">{tr("recommends.intro")}</p>
        <div className="rounded-xl border border-line bg-paper overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">{tr("common.segment")}</th>
                <th className="px-5 py-3 font-medium">{tr("recommends.colTypicalRisk")}</th>
                <th className="px-5 py-3 font-medium">{tr("action.recommended")}</th>
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((row) => (
                <tr key={row.segment} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium text-navy">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: SEGMENT_DOT[row.segment] }}
                        aria-hidden="true"
                      />
                      {segmentLabel(row.segment, locale)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{tr(row.riskKey)}</td>
                  <td className="px-5 py-3.5 text-ink">{actionLabel(row.segment, row.action, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Footer — rebuilt to match tundee.org's 3-column footer (Part B1) ─
          Brand / Built-with / Links, dark-navy band, bottom disclaimer bar.
          Primo has no internal nav, so the middle column carries the tech
          stack instead of site links. */}
      <footer className="bg-navy-dark">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <p className="font-display text-lg font-semibold text-white mb-3">{tr("brand.overline")}</p>
              <p className="text-sm text-white/50 leading-relaxed">{tr("footer.brandTagline")}</p>
            </div>

            {/* Built with */}
            <div>
              <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em] mb-4">
                {tr("footer.stackTitle")}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {STACK.map((s) => (
                  <li key={s} className="text-sm text-white/40">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em] mb-4">
                {tr("footer.linksTitle")}
              </h4>
              <nav className="flex flex-col gap-2.5">
                <a
                  href="https://github.com/tundeeorg-cmd/primo-churn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  {tr("footer.sourceOnGithub")}
                </a>
                <Link
                  href="/dashboard"
                  className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1.5"
                >
                  {tr("nav.openRadar")} <span aria-hidden="true">→</span>
                </Link>
              </nav>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] text-center">
            <p className="text-xs text-white/25">{tr("footer.syntheticNote")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
