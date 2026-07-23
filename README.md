# primo-churn

Churn prediction and analysis for Oberry, a café-chain client, built on the **PRIMO** loyalty platform.

**PRIMO** is the loyalty platform this project is built for. **Oberry** is the (fictional) café-chain client whose loyalty and transaction data the model is trained on — the dashboard and dataset are branded Oberry, but the underlying platform and repo are PRIMO's. The two names are kept distinct throughout this project; neither collapses into the other.

> **Status: work in progress.** Scaffolding is in place; data generation, feature engineering, modeling, and the dashboard are not yet implemented. This README will be rewritten with real usage instructions once the pipeline is functional.

## Architecture

Three tiers, with a hard boundary between them: Python runs the churn pipeline offline and
pushes results into Supabase; the Next.js app on Vercel only ever reads from Supabase — it
never runs Python or loads a model.

```
Python (local, batch) ──push──▶ Supabase (Postgres) ──read──▶ Next.js on Vercel
```

## Tech stack

- **Python 3.12**, managed with [uv](https://docs.astral.sh/uv/)
- **pandas** / **numpy** — data wrangling
- **scikit-learn** / **xgboost** — modeling
- **shap** — model explainability
- **matplotlib** / **seaborn** — static plots
- **python-pptx** — executive-deck export
- **jupyter** — exploratory notebooks
- **Supabase** (Postgres) — scored results, read-only to the browser via Row Level Security
- **Next.js** (TypeScript, Tailwind, App Router), deployed on **Vercel** — the public project page and the Oberry Member Retention Radar dashboard
