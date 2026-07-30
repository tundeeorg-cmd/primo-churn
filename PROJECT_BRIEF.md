# PRIMO Churn Radar — Build Brief & Prompt Pack

A churn-prediction and member-segmentation engine built for **PRIMO** (the AI loyalty &
CRM platform), demonstrated on **Oberry** — a fictional Thai café chain used as the
example client.

> **Keep the two names straight.** PRIMO is the platform this is built *for*. Oberry is the
> client whose loyalty data we model. The repo is `primo-churn`; the dashboard is branded
> "Oberry Member Retention Radar."

- **Repo:** https://github.com/tundeeorg-cmd/primo-churn.git
- **Local path:** `~/Desktop/primo-churn` (renamed from `~/Desktop/oberry`)
- **Stack:** Claude Code · Python · Supabase (Postgres) · Next.js · Vercel

---

## Part A — Architecture

Three tiers with a hard boundary between them. This boundary is the most important design
decision in the project — respect it and everything else stays simple.

```
  TIER 1 — PYTHON (local, batch)        TIER 2 — SUPABASE        TIER 3 — VERCEL
  ────────────────────────────          ─────────────────        ───────────────
  generate synthetic data                                        Next.js app
  engineer features          ──push──▶  Postgres tables  ──read──▶  /           project page
  K-means segmentation                  (scored members,            /dashboard  the radar
  XGBoost training                       segments, metrics,
  SHAP explanations                      actions)
  recommendation rules
```

**Why it splits this way.** Scoring runs once, offline, in Python — that's where pandas,
XGBoost and SHAP live, and none of them belong on a serverless host. Vercel never runs
Python, never loads a model, never does inference. It reads a table and renders it. Real
churn systems work exactly like this (nightly batch scoring into a warehouse, a thin app on
top), so this is an honest architecture rather than a shortcut — worth saying out loud in
the presentation.

**Useful consequence:** the web app can't be wrong in an interesting way. If a number looks
odd, the bug is in Python. That makes debugging dramatically easier.

---

## Part B — Setup

### B1. Rename the folder

```bash
cd ~/Desktop
cp -R oberry oberry_backup_$(date +%Y%m%d)   # safety copy first
mv oberry primo-churn
cd primo-churn
```

Don't delete the backup until the first successful push is visible on GitHub.

### B2. Link the remote

```bash
git init                     # skip if already a repo
git branch -M main
git remote add origin https://github.com/tundeeorg-cmd/primo-churn.git
git remote -v                # verify before anything else
```

### B3. Tools

```bash
# Python side
curl -LsSf https://astral.sh/uv/install.sh | sh
uv init
uv add pandas numpy scikit-learn xgboost shap matplotlib seaborn \
       python-pptx jupyter supabase python-dotenv

# Web side  (Node 20+ — check with `node -v`)
npm create next-app@latest web -- --typescript --tailwind --app --eslint
cd web && npm install @supabase/supabase-js recharts && cd ..

# CLIs
npm install -g vercel
brew install supabase/tap/supabase        # macOS
```

### B4. Accounts (all free tiers)

| Service | Sign in with | What you need from it |
|---|---|---|
| GitHub | — | already have it |
| Supabase | GitHub | project URL, `anon` key, `service_role` key |
| Vercel | GitHub | connects to the repo automatically |

In Supabase: **New project** → name `primo-churn` → region **Southeast Asia (Singapore)** →
save the database password somewhere safe. Keys live under Settings → API.

### B5. Environment variables

Two files. Both gitignored, neither ever committed.

`.env` (repo root, for Python):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...          # service_role — write access, SECRET
```

`web/.env.local` (for Next.js):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... # anon — read-only, safe in the browser
```

> **The one security rule that matters.** The `service_role` key bypasses all database
> permissions. It belongs in `.env` and nowhere else — never in `web/`, never behind a
> `NEXT_PUBLIC_` prefix, never in a committed file. Anything named `NEXT_PUBLIC_*` is
> visible to every visitor of the site. Use the `anon` key there, with Row Level Security
> set to read-only. A leaked service key on a public repo means anyone can drop your tables.

---

## Part C — Repo structure

```
~/Desktop/primo-churn/
├── PROJECT_BRIEF.md
├── README.md                  ← written last, matters most
├── .env                       ← gitignored
├── .env.example
├── Makefile
├── pyproject.toml
├── data/
│   ├── raw/                   ← generated CSVs (gitignored, regenerable)
│   └── processed/             ← feature table, scores, at-risk list
├── src/
│   ├── generate_data.py
│   ├── features.py
│   ├── segment.py
│   ├── model.py
│   ├── evaluate.py
│   ├── explain.py
│   ├── recommend.py
│   └── push_to_supabase.py    ← the bridge between tiers
├── supabase/
│   └── schema.sql
├── notebooks/
│   └── 01_analysis.ipynb
├── web/                       ← Next.js app, deployed to Vercel
│   ├── app/
│   │   ├── page.tsx           ← project page
│   │   ├── dashboard/page.tsx ← the radar
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/supabase.ts
│   ├── public/figures/        ← charts copied from outputs/
│   └── .env.local             ← gitignored
├── outputs/
│   ├── figures/
│   ├── models/
│   ├── metrics.json
│   └── primo_churn_deck.pptx
└── impact_writeup.md
```

---

## Part D — Domain rules

**Business:** Oberry, a Thai café chain — ~40 branches, coffee and light food. Currency ฿.
One point per ฿10 spent, points redeemable for free drinks. Tiers: Bronze, Silver, Gold.

**Churn definition:** no transaction for **60 consecutive days**. Café regulars visit
weekly, so 60 days of silence is a genuine departure rather than a holiday.

| Parameter | Value |
|---|---|
| Members | 20,000 |
| Transactions | ~300,000 |
| Span | 24 months, ending 2026-06-30 |
| Basket | Log-normal, median ฿145, occasional ฿400–900 group orders |
| Cadence | Champions 3–5×/week · Loyal ~1×/week · casual 1–2×/month |
| Tiers | Bronze 60% · Silver 30% · Gold 10% |
| Churn rate | 22–28% — imbalanced, as in real life |

**Patterns the generator must bake in.** Without these the model learns nothing real and
the project is a hollow demo:

- **Cadence decay.** Churners don't stop abruptly — their inter-visit gap widens over 4–8
  weeks first. This is the signal the entire system exists to catch.
- **Basket shrinkage.** Departing members' spend drifts down 15–25% in their final weeks.
- **Redemption effect.** Members who never redeemed points churn noticeably more — they
  never felt the program's value.
- **Onboarding effect.** Members whose second purchase came more than 21 days after the
  first churn far more often, which makes `days_to_second_purchase` genuinely predictive.
- **Tier effect.** Gold members churn less, but cost far more when they do.
- **Seasonality.** Weekday 7–10am peak, weekend afternoon peak, rainy-season dip (Jul–Sep),
  December spike.
- **Branch loyalty.** Members concentrate on one home branch; a broken branch pattern
  signals elevated risk.
- **Noise.** Real randomness. If the model scores above 0.95 ROC-AUC, churn has been made
  too easy to predict — add noise and regenerate.

**Café-specific features beyond RFM:** `gap_trend` (recent inter-visit gap ÷ historical gap
— expected to be the strongest early-warning feature), `morning_visit_ratio`,
`weekend_visit_ratio`, `avg_days_between_visits`, `visits_last_30d_vs_prev_30d`,
`distinct_branches`, `home_branch_share`, `redemption_count`, `points_balance`,
`days_to_second_purchase`, `tenure_days`.

---

## Part E — Supabase schema

Five tables. All public-readable, none writable from the browser.

| Table | Holds | Rows |
|---|---|---|
| `members` | scored members: id, tier, segment, churn_probability, annual_value, features | ~20,000 |
| `at_risk_members` | flagged members with SHAP reasons and recommended action | ~4,000 |
| `segments` | the five segments: name, size, share, mean RFM, strategy | 5 |
| `metrics` | model performance: precision, recall, ROC-AUC, threshold, run date | 1 |
| `actions` | segment × risk → campaign lookup | 5 |

Row Level Security **on** for every table, one policy each: `SELECT` for role `anon`,
nothing else. Python writes with the service key, which bypasses RLS. The browser can only
read.

Index `at_risk_members` on `annual_value DESC` and `churn_probability DESC` — the dashboard
sorts on both.

---

## Part F — Non-negotiables

Each of these is a mistake that quietly ruins churn projects.

1. **Split by time, never randomly.** Build features from data up to a cutoff (2026-04-30),
   label churn using the 60 days *after* it, train on an earlier window and test on a later
   one. A random split leaks the future into the past and produces a fake AUC near 0.99.
2. **No post-cutoff data in any feature.** Recency measured at the cutoff is a feature;
   recency measured at the end of the data is the answer. Assert this in code.
3. **Accuracy is a trap.** At 25% churn, predicting "nobody leaves" scores 75%. Report
   precision, recall, ROC-AUC and PR-AUC, always alongside the trivial baseline.
4. **Keep the logistic regression.** A simple baseline landing close to XGBoost is an
   interesting finding, not a failure.
5. **The service key never touches `web/`.** See B5.
6. **Every published number is labelled illustrative.** Synthetic data presented as
   forecast is the one thing that would undermine the project's credibility.
7. **Seed everything** — `random_state=42` throughout, so results reproduce.
8. **CSVs stay in `data/processed/` even after Supabase works.** If the database is down on
   presentation day, you still have the numbers.

---

## Part G — The prompt pack

Run in order in Claude Code. After each: read the output, check it against Part F, commit,
continue. Don't batch them — reviewing as you go catches errors while they're cheap.

---

### Prompt 1 — Rename & scaffolding

```
Read PROJECT_BRIEF.md.

We are renaming ~/Desktop/oberry to ~/Desktop/primo-churn and setting up the full project.
The repo is https://github.com/tundeeorg-cmd/primo-churn.git on branch main.

Work in this order. Do not skip the inspection step.

1. LOOK FIRST. Show me a recursive tree of ~/Desktop/oberry with file sizes. Tell me
   whether it contains a .git directory, uncommitted work, or anything large. Move nothing
   yet.

2. Safety copy: cp -R ~/Desktop/oberry ~/Desktop/oberry_backup_$(date +%Y%m%d)
   Confirm the file counts match.

3. Rename: mv ~/Desktop/oberry ~/Desktop/primo-churn
   If oberry has its own .git history, flag it to me before touching it — don't merge or
   delete histories on your own.

4. Sort existing files into the structure in Part C — scripts to src/, notebooks to
   notebooks/, CSVs to data/, images to outputs/figures/. If anything is ambiguous, list it
   and ask rather than guessing.

5. Create the rest of the Part C structure, with .gitkeep in empty directories.

6. Python: uv init, then uv add pandas numpy scikit-learn xgboost shap matplotlib seaborn
   python-pptx jupyter supabase python-dotenv

7. Web: npm create next-app@latest web -- --typescript --tailwind --app --eslint
   then in web/: npm install @supabase/supabase-js recharts

8. Write .gitignore covering: .venv/, __pycache__/, .ipynb_checkpoints/, .DS_Store, .env,
   .env.local, web/node_modules/, web/.next/, outputs/models/*.pkl, data/raw/*.csv,
   oberry_backup_*/

   Do NOT ignore data/processed/*.csv, outputs/metrics.json, or outputs/figures/*.png —
   the deck and the offline fallback need them in the repo. Raw data is safe to ignore
   because generate_data.py reproduces it deterministically from seed 42.

9. Write .env.example with the four variable names from Part B5 and empty values, so the
   repo documents what's required without leaking anything.

10. Makefile with targets: data, features, segment, train, evaluate, explain, recommend,
    push, web, all.

11. Placeholder README.md — title, one paragraph, the PRIMO/Oberry distinction, stack,
    "work in progress".

12. Confirm git remote -v points at the right URL, then show me git status and the staged
    file list BEFORE pushing. I want to check nothing unexpected is going up.

Then commit as "Rename oberry to primo-churn; project scaffolding" and push to main.
```

Verify on GitHub before deleting the backup.

---

### Prompt 2 — Data generator

```
Read PROJECT_BRIEF.md. Write src/generate_data.py.

Generate Oberry's synthetic loyalty dataset following Part D exactly. Output to data/raw/:
  members.csv       — member_id, signup_date, tier, home_branch, age_band, city
  transactions.csv  — transaction_id, member_id, transaction_date, branch_id, amount_thb,
                      points_earned, points_redeemed, item_category

Simulate each member individually: assign a latent behavior type, generate their visit
timeline from it, and put a subset into a decay phase where inter-visit gaps widen before
they go silent. Do not sample rows independently — the temporal structure is the point.

Seed with 42. Print a validation summary: member and transaction counts, date range, churn
rate at the 60-day threshold, tier distribution, mean/median basket, and mean inter-visit
gap for churners vs non-churners.

Run it and show me the summary.
```

**Check before continuing:** churn rate lands in 22–28%, and churners' mean gap is clearly
wider than non-churners'. If not, retune the generator — everything downstream depends on
this one file.

---

### Prompt 3 — Exploratory analysis

```
Create notebooks/01_analysis.ipynb exploring data/raw/. Save every figure to
outputs/figures/ as PNG at 150 dpi.

Charts:
  - churn rate by days-since-last-activity, bucketed, with the 60-day threshold marked
  - distributions of basket size and inter-visit gap
  - churn rate by tier, and by whether the member has ever redeemed points
  - monthly active members over time
  - correlation heatmap of candidate numeric features

Palette, used consistently across every figure in this project:
  navy #1F3B57 · teal #2E8B7A · gold #D4A03C · coral #D65C4A · slate #5B7C99
Minimal styling, no chartjunk, readable at slide size — these go in an executive deck.

Write a one-line markdown observation under each chart.
```

---

### Prompt 4 — Features

```
Write src/features.py.

Collapse transactions into one row per member as of CUTOFF_DATE (default 2026-04-30).
Build every feature listed in Part D.

Label: churned if no transaction in the 60 days AFTER the cutoff. Include only members
active at some point in the 90 days before the cutoff — dormant members aren't a retention
opportunity.

Critical: no feature may touch data after CUTOFF_DATE. Add an explicit assertion that
verifies this and fails loudly.

Save data/processed/features.csv. Print shape, class balance, missing-value report.
```

---

### Prompt 5 — Segmentation

```
Write src/segment.py.

Standardize RFM, run K-means for k=2..8, plot elbow and silhouette to outputs/figures/.
Pick k (likely 5) and justify the choice in a comment.

Profile clusters on mean recency, frequency, monetary, tenure and size, then map them to
names: Champions, Loyal, At-risk regulars, Hibernating, One-and-done. Derive the mapping
from the profiles, never from hardcoded cluster numbers — K-means label order changes
between runs.

Produce the bubble chart: recency on x, frequency on y, bubble size = mean spend, one
bubble per segment labelled with name and share.

Write assignments back into data/processed/features.csv and a summary to
data/processed/segments.csv.
```

---

### Prompt 6 — Models

```
Write src/model.py.

Time-based split — train on an earlier cutoff window, test on a later one. Do not use
train_test_split with shuffle. Explain the split in a comment.

Three models to compare:
  1. Majority-class baseline
  2. Logistic regression on scaled features
  3. XGBoost with scale_pos_weight for the imbalance, lightly tuned via RandomizedSearchCV
     over max_depth, learning_rate, n_estimators, subsample

Save to outputs/models/. Print a comparison table: accuracy, precision, recall, F1,
ROC-AUC, PR-AUC.

If XGBoost exceeds 0.95 ROC-AUC, stop and investigate leakage before continuing.
```

---

### Prompt 7 — Evaluation

```
Write src/evaluate.py. Figures to outputs/figures/:
  - ROC curves for both models on one axis, with the random-guess diagonal
  - precision-recall curves
  - confusion matrix for XGBoost with plain labels: caught churn / missed churn /
    false alarm / true stay
  - decile lift chart: members sorted by risk, showing actual churn rate and
    revenue-at-risk per decile

Choose the threshold deliberately: maximize recall subject to precision ≥ 0.70, because
missing a departing member costs more than a wasted coupon. Document the reasoning and
print the chosen value.

Write headline metrics to outputs/metrics.json — the dashboard and the deck both read it.
```

---

### Prompt 8 — Explainability

```
Write src/explain.py using SHAP on the XGBoost model.

Produce a global importance bar chart and a beeswarm plot, plus a function
explain_member(member_id) returning that member's top 3 drivers as plain English:
  "68 days since last visit (+31 points of risk)"
  "visits down 40% against their own baseline (+18 points)"

The plain-English translation matters more than the plots — the dashboard depends on it.
Write an explicit mapping from feature names to human phrasings.

Sanity check: recency and gap_trend should dominate. Anything else on top is a bug or a
leak — investigate before moving on.
```

---

### Prompt 9 — Recommendations

```
Write src/recommend.py. Build the segment × risk → action lookup:

  Champions       / low        → VIP perks, early access to new drinks, referral ask
  Loyal           / low-med    → tier-up nudge, personalized bundle
  At-risk regular / HIGH       → 15%-off win-back coupon + "we miss you" LINE mission
  Hibernating     / very high  → bounce-back free drink + one-question why-survey
  One-and-done    / high       → onboarding mission, second-visit nudge

For each flagged member output: member_id, tier, segment, churn_probability, top 3 SHAP
reasons, recommended action, estimated annual value protected (trailing 12-month spend).

Save data/processed/at_risk_members.csv sorted by annual value DESC, not by probability. A
92%-risk member worth ฿3k matters less than an 80%-risk member worth ฿41k — that
distinction is the entire point of the recommendation layer.
```

---

### Prompt 10 — Supabase schema & upload

```
Read Part E of PROJECT_BRIEF.md.

Write supabase/schema.sql creating the five tables with sensible types and constraints,
plus indexes on at_risk_members(annual_value DESC) and (churn_probability DESC).

Enable Row Level Security on all five, each with exactly one policy: SELECT granted to role
anon. No insert, update or delete from the browser under any circumstances.

Then write src/push_to_supabase.py:
  - loads SUPABASE_URL and SUPABASE_SERVICE_KEY from .env via python-dotenv
  - reads the processed CSVs and metrics.json
  - truncates and re-inserts each table, batching at 1000 rows
  - prints row counts per table and verifies them by reading back
  - fails clearly if credentials are missing, rather than half-writing

Never hardcode a key. Never print a key. Confirm .env is gitignored before running.

Show me the SQL first so I can run it in the Supabase SQL editor, then we'll run the push.
```

---

### Prompt 11 — Next.js foundation

```
Set up the web/ Next.js app (TypeScript, Tailwind, App Router — already scaffolded).

Read /mnt/skills/public/frontend-design/SKILL.md before designing anything.

Create:
  - lib/supabase.ts — typed client using the NEXT_PUBLIC_ vars, with TS interfaces matching
    the five tables in Part E
  - lib/queries.ts — typed fetch functions: getAtRiskMembers, getSegments, getMetrics,
    getMemberDetail
  - app/layout.tsx — shared shell, fonts, metadata

Design direction, applied across both pages: this is an analytical instrument for café
operators, not a SaaS marketing site. Avoid the default dark-dashboard-with-neon-accent
look. Anchor on navy #1F3B57 and teal #2E8B7A, with gold #D4A03C reserved for risk emphasis
and coral #D65C4A for the highest tier of alarm — colour carries meaning here, so never use
an accent decoratively. Pair a characterful display face with a neutral, highly legible body
face and a tabular-figures face for all numbers; misaligned digits in a ranked table are a
real usability failure, not a cosmetic one.

Use server components for data fetching. No client-side loading unless interactivity demands
it. Verify the connection by rendering the member count on a test page.
```

---

### Prompt 12 — The dashboard

```
Build web/app/dashboard/page.tsx — the "Oberry Member Retention Radar".

Layout:
  - KPI row: active members, flagged at-risk, predicted 30-day revenue at risk (฿),
    model recall
  - Left: ranked at-risk table — member id, tier, annual value, risk % — sorted by value at
    risk, rows selectable
  - Right: detail panel for the selected member — churn probability, the three SHAP reasons
    in plain English, recommended action, estimated value protected
  - Bottom: segment distribution as a horizontal stacked bar
  - Controls: filter by segment and tier; a risk-threshold slider that updates the flagged
    count live

Recharts for charts. Loading skeletons, and an empty state that tells the operator what to
do rather than just saying "no data". Responsive down to tablet. Keyboard-navigable table
with visible focus.

Copy rules: write from the operator's side of the screen. "12 members need attention today",
not "12 records matching filter criteria". Buttons name the action they perform.

Footer note: synthetic, illustrative data.
```

---

### Prompt 13 — The project page

```
Build web/app/page.tsx — the public project page. Read the frontend-design skill first.

Sections:
  1. Hero — "Who's About to Leave?", the subtitle, and a prominent link through to
     /dashboard. Open with the most characteristic thing in this project's world; a big
     number with a gradient is the template answer, so find something better.
  2. The problem, two paragraphs, for a reader who has never heard the word "churn"
  3. How it works — five pipeline stages as cards
  4. Results — key figures from outputs/figures/ (copy into web/public/figures/), each with
     a one-line caption a non-technical reader can follow
  5. What it recommends — the segment → action table
  6. Footer — GitHub link, stack, synthetic-data note

Static content, no database calls. Responsive, reduced-motion respected, real copy — no
lorem ipsum, no filler adjectives.
```

Deploy: run `vercel` from the repo root → link to the GitHub repo → set **root directory to
`web`** → add both `NEXT_PUBLIC_` variables in the Vercel dashboard → deploy. Every later
push to `main` redeploys automatically.

---

### Prompt 14 — Executive deck

```
Read /mnt/skills/public/pptx/SKILL.md, then build outputs/primo_churn_deck.pptx with
python-pptx — 7 slides, 16:9, for Oberry executives.

  1. The problem — Oberry quietly loses X% of loyalty members a quarter and nobody sees it
     coming. Lead with money, not method.
  2. What we built — the pipeline in one line: data → segments → risk score → action.
  3. Who your members actually are — five segments, sizes, the RFM bubble chart.
  4. Does it work — ROC and confusion matrix, one honest sentence on what the numbers do and
     don't mean.
  5. Why members leave — SHAP drivers as business insight: silence and widening visit gaps
     predict departure weeks ahead; never-redeemers leave more.
  6. From prediction to action — segment → campaign table plus one worked member example.
  7. What it's worth and what's next — the funnel from 20,000 members to members retained,
     then the honest framing: working prototype on synthetic data, here's what
     productionizing would need.

Executives read 1, 6 and 7 most closely. Max ~30 words of body text per slide. Charts from
outputs/figures/. Project palette. "Illustrative figures · synthetic data" in the footer of
every slide showing numbers. Speaker notes on each slide with what to say out loud.

Include a screenshot of the live dashboard on slide 2 or 6.
```

Export a PDF backup. Rehearse it out loud once — the deck is what executives remember.

---

### Prompt 15 — README & final audit

```
Write the real README.md:
  - what the project does, in two sentences
  - live links: Vercel site and dashboard, plus a screenshot
  - the PRIMO / Oberry distinction
  - architecture diagram (the three tiers, as ASCII)
  - results table from metrics.json
  - full reproduction steps from a fresh clone, including Supabase setup
  - repo structure
  - a prominent synthetic-data note

Also write impact_writeup.md — the one-page plain-language results summary for a
non-technical reader.

Then audit: no keys committed anywhere (grep the git history, not just the working tree), no
broken links, every script runs from a clean clone, .env.example present and accurate.
```

---

## Part H — Finish checklist

- [ ] `~/Desktop/primo-churn` pushed to GitHub; backup verified, then deleted
- [ ] `make all` runs the full pipeline from a fresh clone
- [ ] Leakage assertion passes; time-based split verified
- [ ] Three models reported, including the trivial baseline
- [ ] SHAP reasons read as English sentences, not feature names
- [ ] Supabase RLS on, `anon` read-only, service key absent from git history
- [ ] Vercel site live; dashboard loads real data from Supabase
- [ ] Deck exports to PDF as a backup
- [ ] Every figure, slide and page labelled synthetic/illustrative
- [ ] You can explain, unaided, why accuracy is the wrong metric here

---

## Part I — Pace

| Days | Prompts | You should have |
|---|---|---|
| 1 | 1 | Folder renamed, repo pushed, scaffolding done |
| 2–4 | 2–3 | Realistic dataset and exploratory charts |
| 5–7 | 4–5 | Leak-free feature table and named segments |
| 8–11 | 6–8 | Two trained models, honest metrics, SHAP |
| 12–13 | 9–10 | Recommendations live in Supabase |
| 14–17 | 11–13 | Dashboard and project page deployed on Vercel |
| 18–21 | 14–15 | Deck, README, rehearsal |

**If you fall behind**, cut in this order: hyperparameter tuning, the beeswarm plot, the
threshold slider, then the project page (the dashboard alone is enough). Protect the deck
and the dashboard — the story and the tool are what people remember. The web layer is the
riskiest part of this schedule, so if day 14 arrives with the ML unfinished, finish the ML
and ship screenshots instead of a live site.

---

## Part J — i18n (Thai/English, added post-launch)

`/dashboard` is bilingual, Thai default, English switchable. `/` (the public project page)
is still English-only — this was a deliberate scoping decision, not an oversight; the
glossary and effort for this pass only covered the dashboard. Decisions below exist so a
future session doesn't re-derive or re-litigate them.

**Approach — no i18n library.** `next-intl`/`react-i18next` were deliberately skipped for a
dashboard this size; a dependency-free approach is less likely to break the Vercel build and
easier to reason about. Everything lives under `web/lib/i18n/`:
- `th.ts` / `en.ts` — flat, dot-namespaced dictionaries (`"kpi.activeMembers"`, etc.).
  `en.ts` is typed `Record<keyof typeof th, string>`, so a key present in one file and
  missing from the other **fails `next build`** — that's the actual enforcement mechanism,
  not a manual check.
- `index.ts` — the `Locale` type, `t(locale, key)` (returns the key itself if a translation
  is missing, so gaps are visible on screen rather than silently blank), and `tf()` for the
  handful of `{var}`-interpolated strings.
- `labels.ts` — display-layer lookups from raw Supabase enum values (`segment`, `tier`,
  `riskBadge().label`) to translated text. **Never** touch the underlying value — filtering,
  Set membership, and Recharts `dataKey` all keep comparing/using the raw English string from
  Supabase / `src/segment.py`. Only the rendered JSX text node goes through these.
- `format.ts` — locale-aware currency/date/count formatting (see Gregorian note below).
- `LanguageProvider.tsx` / `useLanguage()` — client context; switching calls
  `router.refresh()`, which re-renders Server Components (translated header strings,
  `<html lang>`) without remounting the Client Component tree, so filters and the selected
  member in `Dashboard.tsx`'s `useState` survive a language switch.
- `cookie.ts` (client-safe) vs. `server.ts` (`next/headers`, server-only) are split into two
  files on purpose — `LanguageProvider.tsx` is a Client Component, and importing a module
  that pulls in `next/headers` anywhere in a Client Component's import graph fails the build.

**Cookie-based locale.** Cookie name `locale`, `path=/`, `max-age` 1 year. Read server-side
in the root layout (`getServerLocale()`) so the very first render already matches the saved
language — no flash of English before Thai loads. **Side effect:** calling `cookies()`
anywhere in the tree opts the whole app into dynamic rendering, so `/` went from statically
generated to server-rendered per request (`ƒ` instead of a static route in the build output).
Accepted tradeoff for correctness over static prerendering on what is a low-traffic internal
dashboard.

**Thai-default decision.** No cookie present → defaults to `'th'`, not `'en'`. PRIMO is a
Thai company and the dashboard's exec audience reads Thai; English-only read as a foreign
demo rather than something built for their market.

**Gregorian-calendar decision.** `th-TH` defaults to the Buddhist Era (e.g. `2569`) unless
the Gregorian calendar is explicitly requested via the `-u-ca-gregory` locale extension.
`lib/i18n/format.ts`'s `formatDate()` opts out of the Thai default deliberately — a BE year
in a business dashboard reads as a bug to half the audience. (No dashboard component
currently renders a date — `Metrics.generated_at`/`train_cutoff`/`test_cutoff` aren't
displayed anywhere yet — so this is exercised the moment that changes, not today.)

**Known, deliberate gaps — don't "fix" these without a product conversation first:**
- `reason_1`/`reason_2`/`reason_3` (SHAP explanations, e.g. *"68 days since last visit (+31
  points of risk)"*) stay English, with a small "(ต้นฉบับภาษาอังกฤษ)" note. They're
  per-member sentences generated in Python with numbers baked in — no finite key space for a
  display-layer dictionary. Translating them properly would mean changing `src/explain.py`
  to emit structured data (metric + value) instead of prose, which is a Python-tier change,
  not a web-tier one.
- `recommended_action` **is** translated, but via a lookup keyed on the member's `segment`
  field (a clean 5-value enum), not by string-matching the English sentence text from
  Supabase — matching sentence text would silently stop working the moment
  `src/recommend.py`'s wording changes.
- Tier names (Bronze/Silver/Gold) stay in Latin script in both locales, same treatment as
  "PRIMO"/"Oberry".
- `riskBadge()` in `lib/theme.ts` only ever produces three buckets — `"Elevated"` (<0.8),
  `"High"` (≥0.8), `"Very high"` (≥0.9) — never `"Low"` in practice, since every
  `at_risk_members` row already cleared the model's threshold. `"Elevated"` maps to the
  glossary's `risk.medium` (ปานกลาง).
- `kpi.daysSinceLastActivity` and `action.launchCampaign` are defined in both dictionaries
  (glossary completeness) but have no current UI call site — no component displays recency,
  and there's no real "launch campaign" button yet.
