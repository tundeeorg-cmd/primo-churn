"""
Segment -> action lookup, and the ranked at-risk member list
(PROJECT_BRIEF.md Prompt 9).

Reuses the already-trained XGBoost model (model.py) and its SHAP
explainer (explain.py) rather than rescoring or re-explaining from
scratch — this script's own new work is just the action lookup and the
trailing-12-month "annual value protected" figure.

Outputs:
    data/processed/actions.csv          5 rows: segment -> typical risk, action.
                                         Feeds the Supabase `actions` table (Part E).
    data/processed/members_scored.csv   ALL test-set members, scored. Feeds the
                                         Supabase `members` table (Part E) — Prompt 9
                                         itself only asks for the flagged subset below,
                                         but nothing else in the pipeline produces a
                                         full scored population, and this is free once
                                         churn_probability is computed anyway.
    data/processed/at_risk_members.csv  Flagged members (churn_probability >= the
                                         chosen threshold from outputs/metrics.json),
                                         with SHAP reasons and a recommended action,
                                         sorted by annual_value_thb DESC — not by risk.
                                         A 92%-risk member worth ฿3k matters less than
                                         an 80%-risk member worth ฿41k.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from explain import make_member_explainer
from features import build_features
from model import NUMERIC_FEATURES, TEST_CUTOFF, _prepare_xy

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "outputs" / "models"
METRICS_PATH = ROOT / "outputs" / "metrics.json"

TRAILING_WINDOW_DAYS = 365

# Segment -> (typical risk band, recommended action). Five rows, one per
# segment — not a full segment x risk-bucket matrix. An individual member's
# risk varies within a segment, but the intervention Oberry runs is chosen
# per segment, so this is the lookup's natural grain (and matches Part E's
# `actions` table: 5 rows). Segment names must match segment.py's
# assign_segment_names() output exactly.
SEGMENT_ACTIONS: dict[str, dict[str, str]] = {
    "Champions": {
        "typical_risk": "low",
        "action": "VIP perks, early access to new drinks, referral ask",
    },
    "Loyal": {
        "typical_risk": "low-med",
        "action": "Tier-up nudge, personalized bundle",
    },
    "At-risk regulars": {
        "typical_risk": "high",
        "action": '15%-off win-back coupon + "we miss you" LINE mission',
    },
    "Hibernating": {
        "typical_risk": "very high",
        "action": "Bounce-back free drink + one-question why-survey",
    },
    "One-and-done": {
        "typical_risk": "high",
        "action": "Onboarding mission, second-visit nudge",
    },
}


def trailing_12mo_spend(cutoff_ts: pd.Timestamp) -> pd.Series:
    """Trailing-12-month spend as of cutoff_ts — Part D's "estimated annual
    value protected" figure. Deliberately NOT features.py's `monetary`
    (lifetime-to-date spend since signup), which overstates value for any
    member with more than a year of tenure."""
    txns = pd.read_csv(RAW / "transactions.csv", parse_dates=["transaction_date"])
    window_start = cutoff_ts - pd.Timedelta(days=TRAILING_WINDOW_DAYS)
    trailing = txns[
        (txns["transaction_date"] > window_start) & (txns["transaction_date"] <= cutoff_ts)
    ]
    return trailing.groupby("member_id")["amount_thb"].sum()


def main() -> None:
    preprocessing = joblib.load(MODELS_DIR / "preprocessing.pkl")
    imputer, feature_cols = preprocessing["imputer"], preprocessing["feature_columns"]
    xgb_model = joblib.load(MODELS_DIR / "xgboost.pkl")

    test_df = build_features(TEST_CUTOFF)

    # Bring in segment from segment.py's output via a member_id join —
    # safer than assuming positional row order lines up, and avoids
    # re-running KMeans (which would only reproduce the same assignment at
    # extra cost and risk).
    seg_lookup = pd.read_csv(PROCESSED / "features.csv")[["member_id", "segment"]]
    test_df = test_df.merge(seg_lookup, on="member_id", how="left")
    missing_segment = int(test_df["segment"].isna().sum())
    if missing_segment:
        raise RuntimeError(
            f"{missing_segment} test-set members have no segment assignment — "
            "does data/processed/features.csv still match TEST_CUTOFF "
            f"({TEST_CUTOFF})? Rerun features.py then segment.py first."
        )

    X_raw, _, _ = _prepare_xy(test_df, dummy_columns=feature_cols)
    X = pd.DataFrame(imputer.transform(X_raw), columns=feature_cols)

    test_df = test_df.assign(churn_probability=xgb_model.predict_proba(X)[:, 1])

    cutoff_ts = pd.Timestamp(TEST_CUTOFF) + pd.Timedelta(hours=23, minutes=59, seconds=59)
    annual_value = trailing_12mo_spend(cutoff_ts)
    test_df["annual_value_thb"] = test_df["member_id"].map(annual_value).fillna(0.0)

    explain_member = make_member_explainer(test_df, X, feature_cols, xgb_model)

    with open(METRICS_PATH) as f:
        threshold = json.load(f)["chosen_threshold"]["value"]
    print(f"Chosen threshold (from outputs/metrics.json): {threshold:.4f}")

    PROCESSED.mkdir(parents=True, exist_ok=True)

    # ── actions.csv (Part E) ─────────────────────────────────────────────
    actions_df = pd.DataFrame(
        [
            {"segment": seg, "typical_risk": v["typical_risk"], "action": v["action"]}
            for seg, v in SEGMENT_ACTIONS.items()
        ]
    )
    actions_df.to_csv(PROCESSED / "actions.csv", index=False)

    # ── members_scored.csv — full population, feeds Part E `members` ─────
    scored_cols = [
        "member_id",
        "tier",
        "segment",
        "churn_probability",
        "annual_value_thb",
        *NUMERIC_FEATURES,
    ]
    members_scored = test_df[scored_cols].copy()
    members_scored.to_csv(PROCESSED / "members_scored.csv", index=False)

    # ── Flag, explain, recommend ─────────────────────────────────────────
    flagged = test_df[test_df["churn_probability"] >= threshold].copy()
    print(
        f"Flagged {len(flagged):,} / {len(test_df):,} members "
        f"({len(flagged) / len(test_df):.1%}) at threshold {threshold:.4f}"
    )

    reasons = flagged["member_id"].apply(lambda mid: explain_member(mid, top_n=3))
    flagged["reason_1"] = reasons.apply(lambda r: r[0] if len(r) > 0 else "")
    flagged["reason_2"] = reasons.apply(lambda r: r[1] if len(r) > 1 else "")
    flagged["reason_3"] = reasons.apply(lambda r: r[2] if len(r) > 2 else "")

    unknown_segments = set(flagged["segment"]) - set(SEGMENT_ACTIONS)
    if unknown_segments:
        raise RuntimeError(
            f"SEGMENT_ACTIONS has no entry for: {unknown_segments}. "
            "Segment names must match segment.py's assign_segment_names() output exactly."
        )
    flagged["recommended_action"] = flagged["segment"].map(lambda s: SEGMENT_ACTIONS[s]["action"])

    out_cols = [
        "member_id",
        "tier",
        "segment",
        "churn_probability",
        "reason_1",
        "reason_2",
        "reason_3",
        "recommended_action",
        "annual_value_thb",
    ]
    at_risk = flagged[out_cols].sort_values("annual_value_thb", ascending=False)
    at_risk.to_csv(PROCESSED / "at_risk_members.csv", index=False)

    print(f"\nSaved: {PROCESSED / 'actions.csv'} ({len(actions_df)} rows)")
    print(f"Saved: {PROCESSED / 'members_scored.csv'} ({len(members_scored):,} rows)")
    print(f"Saved: {PROCESSED / 'at_risk_members.csv'} ({len(at_risk):,} rows)")
    print(
        f"\nTotal annual value protected (flagged members): ฿{at_risk['annual_value_thb'].sum():,.0f}"
    )
    print("\nBy segment:")
    print(
        at_risk.groupby("segment")
        .agg(
            n=("member_id", "size"),
            annual_value_thb=("annual_value_thb", "sum"),
        )
        .sort_values("annual_value_thb", ascending=False)
        .to_string()
    )
    print("\nTop 5 by annual value at risk:")
    print(at_risk.head(5).to_string(index=False))


if __name__ == "__main__":
    main()
