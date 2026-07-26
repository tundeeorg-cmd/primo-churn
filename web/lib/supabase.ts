/**
 * Typed Supabase client (PROJECT_BRIEF.md Prompt 11).
 *
 * Read-only, browser-safe: uses NEXT_PUBLIC_SUPABASE_ANON_KEY, which Row
 * Level Security restricts to SELECT on all five tables (see
 * supabase/schema.sql). This app never writes to Supabase — Python
 * (src/push_to_supabase.py) is the only writer, and the service_role key
 * it uses never appears anywhere under web/.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Row types — one per table in supabase/schema.sql ────────────────────

export interface Member {
  member_id: string;
  tier: "Bronze" | "Silver" | "Gold";
  segment: string;
  churn_probability: number;
  annual_value_thb: number;
  recency_days: number | null;
  frequency: number | null;
  monetary: number | null;
  tenure_days: number | null;
  distinct_branches: number | null;
  home_branch_share: number | null;
  redemption_count: number | null;
  points_balance: number | null;
  morning_visit_ratio: number | null;
  weekend_visit_ratio: number | null;
  avg_days_between_visits: number | null;
  gap_trend: number | null;
  visits_last_30d_vs_prev_30d: number | null;
}

export interface AtRiskMember {
  member_id: string;
  tier: "Bronze" | "Silver" | "Gold";
  segment: string;
  churn_probability: number;
  reason_1: string | null;
  reason_2: string | null;
  reason_3: string | null;
  recommended_action: string;
  annual_value_thb: number;
}

export interface Segment {
  segment: string;
  cluster: number;
  size: number;
  share: number;
  recency_days: number | null;
  frequency: number | null;
  monetary: number | null;
  tenure_days: number | null;
}

export interface ActionRow {
  segment: string;
  typical_risk: string;
  action: string;
}

export interface Metrics {
  id: number;
  generated_at: string;
  train_cutoff: string;
  test_cutoff: string;
  test_set_size: number;
  test_churn_rate: number;
  lr_roc_auc: number;
  lr_pr_auc: number;
  xgb_roc_auc: number;
  xgb_pr_auc: number;
  threshold_value: number;
  threshold_precision: number;
  threshold_recall: number;
  threshold_met_precision_floor: boolean;
  threshold_rationale: string;
  true_stay: number;
  false_alarm: number;
  missed_churn: number;
  caught_churn: number;
  model_recall: number;
}

export interface Database {
  public: {
    Tables: {
      members: { Row: Member; Insert: Member; Update: Partial<Member> };
      at_risk_members: { Row: AtRiskMember; Insert: AtRiskMember; Update: Partial<AtRiskMember> };
      segments: { Row: Segment; Insert: Segment; Update: Partial<Segment> };
      actions: { Row: ActionRow; Insert: ActionRow; Update: Partial<ActionRow> };
      metrics: { Row: Metrics; Insert: Metrics; Update: Partial<Metrics> };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy the two NEXT_PUBLIC_* vars into web/.env.local (see PROJECT_BRIEF.md Part B5)."
  );
}

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey);
