"""
Collapse transactions into a one-row-per-member feature table as of
CUTOFF_DATE (PROJECT_BRIEF.md Part D / Prompt 4).

Every feature is computed strictly from transactions on or before
CUTOFF_DATE. The churn label looks at the 60 days AFTER the cutoff — by
design that's the only place post-cutoff data is allowed to appear, and
it's built from a completely separate slice of the transaction data than
the one features are computed on. An explicit assertion checks this
before anything is saved, and fails loudly if it's ever violated.

Population: only members with at least one transaction in the 90 days
before CUTOFF_DATE — dormant members aren't a retention opportunity.

Usage:
    uv run python src/features.py [--cutoff YYYY-MM-DD]

Output:
    data/processed/features.csv
"""

# Author: Jenissa Vichiansin — International School Bangkok

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

DEFAULT_CUTOFF = date(2026, 4, 30)
CHURN_SILENCE_DAYS = 60
ACTIVE_WINDOW_DAYS = 90

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"


def build_features(cutoff_date: date) -> pd.DataFrame:
    cutoff_ts = pd.Timestamp(cutoff_date) + pd.Timedelta(hours=23, minutes=59, seconds=59)

    members = pd.read_csv(RAW / "members.csv", parse_dates=["signup_date"])
    txns = pd.read_csv(RAW / "transactions.csv", parse_dates=["transaction_date"])

    # ── The only two views of the data anything downstream ever sees.
    # feature_txns feeds every feature; label_txns feeds only the label.
    # They cannot overlap by construction (<=cutoff vs strictly >cutoff).
    feature_txns = txns[txns["transaction_date"] <= cutoff_ts].copy()
    label_window_end = cutoff_ts + pd.Timedelta(days=CHURN_SILENCE_DAYS)
    label_txns = txns[
        (txns["transaction_date"] > cutoff_ts) & (txns["transaction_date"] <= label_window_end)
    ]

    assert (
        feature_txns["transaction_date"].max() <= cutoff_ts
    ), "LEAKAGE: a transaction used for features is dated after CUTOFF_DATE"
    assert not set(feature_txns.index) & set(
        label_txns.index
    ), "LEAKAGE: the same transaction row appears in both the feature and label windows"

    # ── Population: active at some point in the 90 days before cutoff ─────
    active_since = cutoff_ts - pd.Timedelta(days=ACTIVE_WINDOW_DAYS)
    active_ids = feature_txns.loc[
        feature_txns["transaction_date"] >= active_since, "member_id"
    ].unique()
    pop = members[members["member_id"].isin(active_ids)].set_index("member_id").copy()
    feature_txns = feature_txns[feature_txns["member_id"].isin(active_ids)]

    assert set(pop.index) <= set(
        active_ids
    ), "population includes a member outside the 90-day active window"

    # ── RFM + tenure ────────────────────────────────────────────────────
    last_txn = feature_txns.groupby("member_id")["transaction_date"].max()
    pop["recency_days"] = (cutoff_ts - last_txn).dt.days
    pop["frequency"] = feature_txns.groupby("member_id").size()
    pop["monetary"] = feature_txns.groupby("member_id")["amount_thb"].sum()
    pop["tenure_days"] = (cutoff_ts - pop["signup_date"]).dt.days

    # ── Café-specific features (Part D) ────────────────────────────────
    pop["distinct_branches"] = feature_txns.groupby("member_id")["branch_id"].nunique()

    home_hits = feature_txns.merge(members[["member_id", "home_branch"]], on="member_id")
    pop["home_branch_share"] = (
        (home_hits["branch_id"] == home_hits["home_branch"]).groupby(home_hits["member_id"]).mean()
    )

    pop["redemption_count"] = feature_txns.groupby("member_id")["points_redeemed"].apply(
        lambda s: (s > 0).sum()
    )
    pop["points_balance"] = (
        feature_txns.groupby("member_id")["points_earned"].sum()
        - feature_txns.groupby("member_id")["points_redeemed"].sum()
    )

    txn_hour = feature_txns["transaction_date"].dt.hour
    txn_weekend = feature_txns["transaction_date"].dt.weekday >= 5
    pop["morning_visit_ratio"] = (
        feature_txns.assign(_m=txn_hour.between(6, 10)).groupby("member_id")["_m"].mean()
    )
    pop["weekend_visit_ratio"] = (
        feature_txns.assign(_w=txn_weekend).groupby("member_id")["_w"].mean()
    )

    def _visit_history_stats(dates: pd.Series) -> pd.Series:
        d = dates.sort_values()
        if len(d) < 2:
            return pd.Series(
                {
                    "avg_days_between_visits": np.nan,
                    "gap_trend": np.nan,
                    "days_to_second_purchase": np.nan,
                }
            )
        gaps = d.diff().dt.total_seconds().div(86400).dropna()
        recent, historical = gaps.tail(3), gaps.iloc[: max(0, len(gaps) - 3)]
        trend = recent.mean() / historical.mean() if len(historical) else np.nan
        return pd.Series(
            {
                "avg_days_between_visits": gaps.mean(),
                "gap_trend": trend,
                "days_to_second_purchase": gaps.iloc[0],
            }
        )

    history_df = (
        feature_txns.groupby("member_id")["transaction_date"].apply(_visit_history_stats).unstack()
    )
    pop = pop.join(history_df)

    cutoff_m30 = cutoff_ts - pd.Timedelta(days=30)
    cutoff_m60 = cutoff_ts - pd.Timedelta(days=60)
    recent_30 = (
        feature_txns[feature_txns["transaction_date"] > cutoff_m30].groupby("member_id").size()
    )
    prev_30 = (
        feature_txns[
            (feature_txns["transaction_date"] > cutoff_m60)
            & (feature_txns["transaction_date"] <= cutoff_m30)
        ]
        .groupby("member_id")
        .size()
    )
    # +1/+1 (Laplace) smoothing so the ratio is always defined, including
    # for members with zero visits in one of the two windows.
    pop["visits_last_30d_vs_prev_30d"] = (recent_30.reindex(pop.index, fill_value=0) + 1) / (
        prev_30.reindex(pop.index, fill_value=0) + 1
    )

    # ── Label — the ONLY place label_txns is used ──────────────────────
    returned_ids = set(label_txns["member_id"].unique())
    pop["churned"] = (~pop.index.isin(returned_ids)).astype(int)

    return pop.reset_index()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cutoff", type=str, default=None, help="YYYY-MM-DD, default 2026-04-30")
    args = parser.parse_args()
    cutoff_date = date.fromisoformat(args.cutoff) if args.cutoff else DEFAULT_CUTOFF

    df = build_features(cutoff_date)

    PROCESSED.mkdir(parents=True, exist_ok=True)
    out_path = PROCESSED / "features.csv"
    df.to_csv(out_path, index=False)

    print("=" * 60)
    print(f"FEATURES — cutoff {cutoff_date}  (label window: +{CHURN_SILENCE_DAYS}d)")
    print("=" * 60)
    print(f"Saved: {out_path}")
    print(f"Shape: {df.shape}")
    print()
    print("Class balance (churned):")
    print(df["churned"].value_counts(normalize=True).rename("share").to_string())
    print()
    print("Missing values:")
    print(df.isnull().sum().to_string())
    print("=" * 60)


if __name__ == "__main__":
    main()
