import Image from "next/image";
import Link from "next/link";

const PIPELINE_STAGES = [
  {
    n: "01",
    title: "Learn from two years of visits",
    body: "Every purchase, branch, and point redemption across roughly 20,000 members feeds the model — 24 months of the ordinary rhythm of a café chain.",
  },
  {
    n: "02",
    title: "Turn history into signals",
    body: "Recency, spending trend, visit-gap trend, redemption habits — all computed as of one fixed date, with an explicit check that nothing from after that date leaks in.",
  },
  {
    n: "03",
    title: "Group members by behavior",
    body: "Unsupervised clustering finds five natural groups on its own, from Champions to members who are already fading — never hand-picked cluster numbers.",
  },
  {
    n: "04",
    title: "Score who's likely to leave",
    body: "A model trained on an earlier period is tested on a later one it has never seen, and ranks every member by how likely they are to go quiet.",
  },
  {
    n: "05",
    title: "Recommend what to do about it",
    body: "Each flagged member gets a plain-English reason and a specific next step — not just a risk percentage sitting in a spreadsheet.",
  },
];

const RESULTS = [
  {
    src: "/figures/07_segment_bubble_chart.png",
    width: 1425,
    height: 1050,
    alt: "Bubble chart of five member segments positioned by recency and visit frequency, sized by mean spend",
    caption:
      "Members split into five natural groups — a handful of big-spending Champions, a broad base of Loyal regulars, and a slice already gone quiet.",
  },
  {
    src: "/figures/03_churn_by_tier_and_redemption.png",
    width: 1500,
    height: 675,
    alt: "Two bar charts showing churn rate by loyalty tier and by whether a member ever redeemed points",
    caption:
      "Gold members leave far less often than Bronze — and members who never once redeemed a point churn noticeably more than those who did.",
  },
  {
    src: "/figures/10_confusion_matrix.png",
    width: 975,
    height: 900,
    alt: "Confusion matrix labeled true stay, false alarm, missed churn, and caught churn",
    caption:
      "The model catches most departing members before they're gone, at the cost of a manageable number of false alarms — never a perfect score, always an honest one.",
  },
  {
    src: "/figures/11_decile_lift_chart.png",
    width: 1500,
    height: 825,
    alt: "Decile lift chart showing actual churn rate and revenue at risk, concentrated in the highest-risk decile",
    caption:
      "The riskiest 10% of members account for a wildly disproportionate share of the revenue on the line — that's where outreach should start first.",
  },
];

const ACTIONS = [
  {
    segment: "Champions",
    risk: "low",
    action: "VIP perks, early access to new drinks, referral ask",
  },
  {
    segment: "Loyal",
    risk: "low–med",
    action: "Tier-up nudge, personalized bundle",
  },
  {
    segment: "At-risk regulars",
    risk: "high",
    action: '15%-off win-back coupon + "we miss you" LINE mission',
  },
  {
    segment: "Hibernating",
    risk: "very high",
    action: "Bounce-back free drink + one-question why-survey",
  },
  {
    segment: "One-and-done",
    risk: "high",
    action: "Onboarding mission, second-visit nudge",
  },
];

const SEGMENT_DOT: Record<string, string> = {
  Champions: "#1f3b57",
  Loyal: "#2e8b7a",
  "At-risk regulars": "#d4a03c",
  Hibernating: "#d65c4a",
  "One-and-done": "#5b7c99",
};

export default function Home() {
  return (
    <main className="flex-1">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1000px] mx-auto px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="text-xs font-medium uppercase tracking-wide text-teal mb-4">
          PRIMO Churn Radar
        </p>
        <h1 className="font-display text-4xl sm:text-6xl font-semibold text-navy leading-[1.05] mb-6 max-w-[16ch]">
          Who&apos;s about to leave?
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-center mb-10">
          <p className="text-lg text-ink leading-relaxed max-w-[52ch]">
            <em className="not-italic text-ink-muted">
              A member came in every Tuesday for eight months. Then Tuesday became Thursday.
              Then once every other week. Then nothing — sixty quiet days before anyone at Oberry
              noticed she was gone.
            </em>{" "}
            That widening gap is the signal this whole system exists to catch, weeks before the
            last visit — not a sudden drop, and not a big number with a gradient behind it.
          </p>

          {/* Widening-gap sparkline — the one visual idea in this hero */}
          <svg
            viewBox="0 0 260 90"
            className="w-full max-w-[260px] shrink-0"
            role="img"
            aria-label="A sequence of visits spaced closely together, then widening, then a long gap of silence"
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
              60 days silent
            </text>
          </svg>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-navy text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-navy-dark transition-colors motion-reduce:transition-none"
        >
          Open the Radar →
        </Link>
      </section>

      {/* ── The problem ──────────────────────────────────────────────────── */}
      <section className="bg-paper border-y border-line">
        <div className="max-w-[760px] mx-auto px-6 py-14 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-6">
            The quiet problem in every loyalty program
          </h2>
          <p className="text-ink leading-relaxed mb-4">
            &ldquo;Churn&rdquo; just means a member who used to come back regularly has stopped —
            no cancellation, no complaint, nothing dramatic. For a café chain built on repeat
            visits, that&apos;s the entire business model quietly leaking away, one person at a
            time, with no alarm going off anywhere.
          </p>
          <p className="text-ink leading-relaxed">
            The trouble is timing. By the time an operator notices a regular hasn&apos;t been in
            for two months, winning them back is far more expensive than it would have been to
            reach out while they were merely drifting. A prediction system flips that around: it
            watches the early signs — visits spacing out, spending trailing off — and flags a
            member while there&apos;s still time to do something about it.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-6 py-14 sm:py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-10">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.n} className="rounded-xl border border-line bg-paper p-5">
              <p className="font-display text-3xl font-semibold text-teal mb-3 tabular-figures">
                {stage.n}
              </p>
              <h3 className="font-semibold text-navy mb-2 leading-snug">{stage.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{stage.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <section className="bg-paper border-y border-line">
        <div className="max-w-[1100px] mx-auto px-6 py-14 sm:py-20">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-10">
            Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {RESULTS.map((r) => (
              <figure key={r.src}>
                <div className="rounded-xl border border-line overflow-hidden bg-canvas">
                  <Image
                    src={r.src}
                    alt={r.alt}
                    width={r.width}
                    height={r.height}
                    className="w-full h-auto"
                  />
                </div>
                <figcaption className="text-sm text-ink-muted leading-relaxed mt-3">
                  {r.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it recommends ──────────────────────────────────────────── */}
      <section className="max-w-[900px] mx-auto px-6 py-14 sm:py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-navy mb-3">
          What it recommends
        </h2>
        <p className="text-ink-muted mb-8 max-w-[60ch]">
          Every flagged member&apos;s segment maps to a specific campaign — not a generic
          &ldquo;reach out,&rdquo; but a next step sized to how urgent and how valuable that
          member actually is.
        </p>
        <div className="rounded-xl border border-line bg-paper overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Typical risk</th>
                <th className="px-5 py-3 font-medium">Recommended action</th>
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
                      {row.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted">{row.risk}</td>
                  <td className="px-5 py-3.5 text-ink">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="max-w-[1100px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-ink-muted">
              <a
                href="https://github.com/tundeeorg-cmd/primo-churn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy font-medium hover:underline"
              >
                Source on GitHub
              </a>{" "}
              · Python, XGBoost, SHAP, Supabase, Next.js, Vercel
            </p>
            <p className="text-xs text-ink-muted mt-1.5">
              Illustrative figures · synthetic data. Oberry is a fictional café chain used to
              demonstrate PRIMO&apos;s churn-prediction engine.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-navy hover:underline shrink-0">
            Open the Radar →
          </Link>
        </div>
      </footer>
    </main>
  );
}
