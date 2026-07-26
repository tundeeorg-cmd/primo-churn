-- PRIMO Churn Radar — Supabase schema (PROJECT_BRIEF.md Part E / Prompt 10)
--
-- Five tables, all public-readable, none writable from the browser. Python
-- (src/push_to_supabase.py) writes with the service_role key, which bypasses
-- RLS entirely; every other client only ever gets the anon key, which RLS
-- restricts to SELECT.
--
-- Run this whole file once in the Supabase SQL editor before the first
-- `uv run python src/push_to_supabase.py`. Re-running it is safe — every
-- statement is idempotent (drop-if-exists / create-if-not-exists).

-- ── members ───────────────────────────────────────────────────────────────
-- Every scored member as of TEST_CUTOFF (2026-04-30), not just the flagged
-- subset — feeds the dashboard's overall KPIs and segment breakdowns.
drop table if exists public.members cascade;
create table public.members (
    member_id                     text primary key,
    tier                          text not null check (tier in ('Bronze', 'Silver', 'Gold')),
    segment                       text not null,
    churn_probability             double precision not null check (churn_probability between 0 and 1),
    annual_value_thb              numeric(12, 2) not null default 0,
    recency_days                  integer,
    frequency                     integer,
    monetary                      numeric(12, 2),
    tenure_days                   integer,
    distinct_branches             integer,
    home_branch_share             double precision,
    redemption_count              integer,
    points_balance                integer,
    morning_visit_ratio           double precision,
    weekend_visit_ratio           double precision,
    avg_days_between_visits       double precision,
    gap_trend                     double precision,
    visits_last_30d_vs_prev_30d   double precision
);

-- ── at_risk_members ──────────────────────────────────────────────────────
-- The flagged subset of `members` (churn_probability >= the chosen
-- threshold), with SHAP reasons and a recommended action attached. FK to
-- `members` since every at-risk member is, by construction, also a row
-- there.
drop table if exists public.at_risk_members cascade;
create table public.at_risk_members (
    member_id            text primary key references public.members (member_id),
    tier                 text not null check (tier in ('Bronze', 'Silver', 'Gold')),
    segment              text not null,
    churn_probability    double precision not null check (churn_probability between 0 and 1),
    reason_1             text,
    reason_2             text,
    reason_3             text,
    recommended_action   text not null,
    annual_value_thb     numeric(12, 2) not null default 0
);

-- Part E: the dashboard sorts on both.
create index if not exists idx_at_risk_annual_value on public.at_risk_members (annual_value_thb desc);
create index if not exists idx_at_risk_churn_probability on public.at_risk_members (churn_probability desc);

-- ── segments ──────────────────────────────────────────────────────────────
-- One row per K-means segment: name, size, share, mean RFM. Values here are
-- means/aggregates (hence double precision, not integer) even for columns
-- that are integer-valued per-member in `members`.
drop table if exists public.segments cascade;
create table public.segments (
    segment       text primary key,
    cluster       integer not null,
    size          integer not null,
    share         double precision not null,
    recency_days  double precision,
    frequency     double precision,
    monetary      numeric(12, 2),
    tenure_days   double precision
);

-- ── actions ───────────────────────────────────────────────────────────────
-- Segment -> recommended-campaign lookup, 5 rows. FK to `segments` since
-- every action row corresponds to exactly one segment.
drop table if exists public.actions cascade;
create table public.actions (
    segment        text primary key references public.segments (segment),
    typical_risk   text not null,
    action         text not null
);

-- ── metrics ───────────────────────────────────────────────────────────────
-- Single-row table: one snapshot of model performance per pipeline run.
-- `id` is pinned to 1 so the push script can upsert-on-conflict instead of
-- accumulating a new row every run.
drop table if exists public.metrics cascade;
create table public.metrics (
    id                              integer primary key default 1 check (id = 1),
    generated_at                    timestamptz not null,
    train_cutoff                    date not null,
    test_cutoff                     date not null,
    test_set_size                   integer not null,
    test_churn_rate                 double precision not null,
    lr_roc_auc                      double precision not null,
    lr_pr_auc                       double precision not null,
    xgb_roc_auc                     double precision not null,
    xgb_pr_auc                      double precision not null,
    threshold_value                 double precision not null,
    threshold_precision             double precision not null,
    threshold_recall                double precision not null,
    threshold_met_precision_floor   boolean not null,
    threshold_rationale             text not null,
    true_stay                       integer not null,
    false_alarm                     integer not null,
    missed_churn                    integer not null,
    caught_churn                    integer not null,
    model_recall                    double precision not null
);

-- ── Row Level Security ───────────────────────────────────────────────────
-- Exactly one policy per table: SELECT for role anon. No insert, update, or
-- delete policy exists for anon on any table, so those are denied by
-- default — RLS with no matching policy means no access, not open access.
alter table public.members enable row level security;
alter table public.at_risk_members enable row level security;
alter table public.segments enable row level security;
alter table public.actions enable row level security;
alter table public.metrics enable row level security;

drop policy if exists "public read" on public.members;
create policy "public read" on public.members for select to anon using (true);

drop policy if exists "public read" on public.at_risk_members;
create policy "public read" on public.at_risk_members for select to anon using (true);

drop policy if exists "public read" on public.segments;
create policy "public read" on public.segments for select to anon using (true);

drop policy if exists "public read" on public.actions;
create policy "public read" on public.actions for select to anon using (true);

drop policy if exists "public read" on public.metrics;
create policy "public read" on public.metrics for select to anon using (true);
