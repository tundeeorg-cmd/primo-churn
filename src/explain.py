"""
SHAP explainability for the XGBoost churn model (PROJECT_BRIEF.md Prompt 8).

Two things this produces:
  - Global: mean |SHAP| bar chart + beeswarm, on the test set.
  - Per-member: explain_member(member_id) -> top-3 drivers as plain-English
    sentences with an approximate "points of risk" contribution.

The plain-English translation matters more than the plots — the dashboard
depends on it, never on raw SHAP values. FEATURE_PHRASING is an explicit,
hand-written feature -> sentence mapping.

Points of risk are SHAP values in PROBABILITY space (percentage points of
predicted churn probability), not log-odds — a raw margin number means
nothing to a café operator, but "+31 points of risk" does. The global
plots use the (exact, background-free) log-odds SHAP values instead,
since that's the standard convention for those chart types.
"""

from __future__ import annotations

import sys
from collections.abc import Callable
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from matplotlib.colors import LinearSegmentedColormap

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import build_features
from model import TEST_CUTOFF, _prepare_xy

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "outputs" / "models"
FIG_DIR = ROOT / "outputs" / "figures"

NAVY, TEAL, GOLD, CORAL, SLATE = "#1F3B57", "#2E8B7A", "#D4A03C", "#D65C4A", "#5B7C99"

plt.rcParams.update(
    {
        "figure.dpi": 150,
        "savefig.dpi": 150,
        "font.size": 11,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.grid": True,
        "grid.alpha": 0.25,
        "grid.linewidth": 0.5,
        "figure.facecolor": "white",
        "axes.facecolor": "white",
    }
)


def _pct(x: float) -> str:
    return f"{x:.0%}"


# ── Feature name -> plain-English phrasing ──────────────────────────────────
# Each callable takes the member's (post-imputation) feature value and
# returns the descriptive clause a non-technical reader can follow.
FEATURE_PHRASING: dict[str, Callable[[float], str]] = {
    "recency_days": lambda v: f"{v:.0f} days since last visit",
    "gap_trend": lambda v: (
        # "% less often" reads fine up to ~doubling (100%), but "517% less
        # often" is nonsensical — you can't visit more than 100% less than
        # you used to. Switch to a multiple once the gap has more than
        # doubled instead of letting the percentage run away.
        f"typical gap between visits is now {v:.1f}x longer than their own usual pattern"
        if v >= 2.0
        else (
            f"visiting {(v - 1) * 100:.0f}% less often than their own usual pattern"
            if v >= 1
            else f"visiting {(1 - v) * 100:.0f}% more often than their own usual pattern"
        )
    ),
    "tenure_days": lambda v: f"a member for {v:.0f} days",
    "frequency": lambda v: f"{v:.0f} visits on record",
    "monetary": lambda v: f"฿{v:,.0f} spent to date",
    "distinct_branches": lambda v: f"visited {v:.0f} different branches",
    "home_branch_share": lambda v: (
        f"only {_pct(v)} of visits at their home branch — spreading across locations"
        if v < 0.5
        else f"{_pct(v)} of visits at their home branch — consistently loyal to one location"
    ),
    "redemption_count": lambda v: (
        "never redeemed a point" if v == 0 else f"redeemed points {v:.0f} times"
    ),
    "points_balance": lambda v: f"{v:.0f} points sitting unused",
    "morning_visit_ratio": lambda v: f"{_pct(v)} of visits in the morning rush",
    "weekend_visit_ratio": lambda v: f"{_pct(v)} of visits on weekends",
    "avg_days_between_visits": lambda v: f"visits roughly every {v:.0f} days",
    "visits_last_30d_vs_prev_30d": lambda v: (
        f"visits down {(1 - v) * 100:.0f}% in the last 30 days vs. the 30 before"
        if v < 1
        else f"visits up {(v - 1) * 100:.0f}% in the last 30 days vs. the 30 before"
    ),
    "tier_Bronze": lambda v: "Bronze-tier member",
    "tier_Silver": lambda v: "Silver-tier member",
    "tier_Gold": lambda v: "Gold-tier member",
}


def phrase(feature: str, value: float) -> str:
    fn = FEATURE_PHRASING.get(feature)
    if fn is None:
        return f"{feature} = {value:.2f}"
    return fn(value)


def make_member_explainer(
    test_df: pd.DataFrame,
    X: pd.DataFrame,
    feature_cols: list[str],
    xgb_model,
) -> Callable[..., list[str]]:
    """Build the probability-space SHAP explainer once and return a reusable
    explain_member(member_id, top_n=3) -> list[str] closure over it.

    Interventional perturbation + a background sample gives SHAP values in
    PROBABILITY space directly — "+31 points of risk" needs to be
    percentage points of predicted probability, not raw log-odds. Building
    the explainer once and reusing it (rather than reconstructing it per
    call) matters for callers like recommend.py that explain hundreds of
    members: the background sample and explainer setup are the expensive
    part, not any individual member's SHAP values.
    """
    background = X.sample(n=min(200, len(X)), random_state=42)
    prob_explainer = shap.TreeExplainer(
        xgb_model,
        data=background,
        feature_perturbation="interventional",
        model_output="probability",
    )

    def explain_member(member_id: str, top_n: int = 3) -> list[str]:
        matches = test_df.index[test_df["member_id"] == member_id]
        if len(matches) == 0:
            raise KeyError(f"member_id {member_id!r} not found in the test-set feature table")
        pos = matches[0]
        row = X.iloc[[pos]]
        sv = prob_explainer.shap_values(row)[0]
        order = np.argsort(sv)[::-1][:top_n]
        sentences = []
        for i in order:
            feat = feature_cols[i]
            val = row.iloc[0][feat]
            pts = sv[i] * 100
            sign = "+" if pts >= 0 else ""
            sentences.append(f"{phrase(feat, val)} ({sign}{pts:.0f} points of risk)")
        return sentences

    return explain_member


def main() -> None:
    preprocessing = joblib.load(MODELS_DIR / "preprocessing.pkl")
    imputer, feature_cols = preprocessing["imputer"], preprocessing["feature_columns"]
    xgb_model = joblib.load(MODELS_DIR / "xgboost.pkl")

    test_df = build_features(TEST_CUTOFF)
    X_raw, _, _ = _prepare_xy(test_df, dummy_columns=feature_cols)
    X = pd.DataFrame(imputer.transform(X_raw), columns=feature_cols)

    # tree_path_dependent perturbation: exact, fast, no background sample —
    # standard choice for global importance/beeswarm. Log-odds (margin) space.
    explainer = shap.TreeExplainer(xgb_model)
    shap_values_margin = explainer.shap_values(X)

    # ── Global importance bar chart ─────────────────────────────────────
    mean_abs_shap = pd.Series(np.abs(shap_values_margin).mean(axis=0), index=feature_cols)
    mean_abs_shap_sorted = mean_abs_shap.sort_values(ascending=True)

    fig, ax = plt.subplots(figsize=(8, 7))
    ax.barh(mean_abs_shap_sorted.index, mean_abs_shap_sorted.values, color=NAVY)
    ax.set_xlabel("Mean |SHAP value| (log-odds)")
    ax.set_title("Global feature importance")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "12_shap_importance.png", dpi=150)
    plt.close(fig)

    # ── Sanity check: recency_days / gap_trend should dominate ─────────
    top2 = mean_abs_shap.sort_values(ascending=False).index[:2].tolist()
    print("Top 2 features by mean |SHAP|:", top2)
    if not {"recency_days", "gap_trend"} & set(top2):
        raise RuntimeError(
            f"SANITY CHECK FAILED: top 2 features are {top2}, neither is recency_days "
            "nor gap_trend. Part D expects these to dominate — investigate for a bug "
            "or leak before trusting this model's explanations."
        )

    # ── Beeswarm ─────────────────────────────────────────────────────────
    project_cmap = LinearSegmentedColormap.from_list("project_diverging", [CORAL, "#FFFFFF", NAVY])
    fig = plt.figure(figsize=(9, 7))
    shap.summary_plot(shap_values_margin, X, show=False, cmap=project_cmap)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "13_shap_beeswarm.png", dpi=150)
    plt.close(fig)

    # ── Per-member probability-space SHAP (for explain_member) ─────────
    explain_member = make_member_explainer(test_df, X, feature_cols, xgb_model)

    # Demo on a genuinely at-risk member so the printed example is meaningful.
    xgb_proba = xgb_model.predict_proba(X)[:, 1]
    demo_pos = int(np.argmax(xgb_proba))
    demo_member = test_df.iloc[demo_pos]["member_id"]
    print(f"\nexplain_member({demo_member!r}) [predicted risk {xgb_proba[demo_pos]:.1%}]:")
    for line in explain_member(demo_member):
        print(f"  - {line}")

    # A second example at a more middling risk level, for contrast.
    mid_pos = int(np.argsort(np.abs(xgb_proba - 0.5))[0])
    mid_member = test_df.iloc[mid_pos]["member_id"]
    print(f"\nexplain_member({mid_member!r}) [predicted risk {xgb_proba[mid_pos]:.1%}]:")
    for line in explain_member(mid_member):
        print(f"  - {line}")


if __name__ == "__main__":
    main()
