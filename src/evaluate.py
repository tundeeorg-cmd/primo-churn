"""
Evaluate the trained models on the test set (PROJECT_BRIEF.md Prompt 7).

Reuses build_features() and model.py's exact preprocessing pipeline
(imputer/scaler/feature columns, all fit on TRAIN only) so the test set
here is identical to the one model.py scored during training.

Figures -> outputs/figures/:
    08_roc_curves.png
    09_precision_recall_curves.png
    10_confusion_matrix.png
    11_decile_lift_chart.png

Also writes outputs/metrics.json — read by both the Next.js dashboard
and the executive deck.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    auc, average_precision_score, confusion_matrix,
    precision_recall_curve, roc_curve,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import build_features  # noqa: E402
from model import TEST_CUTOFF, TRAIN_CUTOFF, _prepare_xy  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "outputs" / "models"
FIG_DIR = ROOT / "outputs" / "figures"
METRICS_PATH = ROOT / "outputs" / "metrics.json"

NAVY, TEAL, GOLD, CORAL, SLATE = "#1F3B57", "#2E8B7A", "#D4A03C", "#D65C4A", "#5B7C99"

plt.rcParams.update({
    "figure.dpi": 150, "savefig.dpi": 150, "font.size": 11,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.alpha": 0.25, "grid.linewidth": 0.5,
    "figure.facecolor": "white", "axes.facecolor": "white",
})

PRECISION_FLOOR = 0.70  # missing a departing member costs more than a
# wasted coupon, so we deliberately trade precision down to this floor to
# buy back as much recall as possible — not the other way around


def choose_threshold(y_true: np.ndarray, proba: np.ndarray) -> dict:
    """Maximize recall subject to precision >= PRECISION_FLOOR."""
    precisions, recalls, thresholds = precision_recall_curve(y_true, proba)
    # precision_recall_curve returns one more precision/recall point than
    # thresholds (the last point is precision=1, recall=0 with no threshold);
    # drop it so the three arrays align index-for-index.
    precisions, recalls = precisions[:-1], recalls[:-1]

    meets_floor = precisions >= PRECISION_FLOOR
    if meets_floor.any():
        candidates = np.where(meets_floor)[0]
        best = candidates[np.argmax(recalls[candidates])]
        met_floor = True
    else:
        # No threshold clears the floor — fall back to the best precision
        # actually achievable, and say so loudly rather than pretending.
        best = int(np.argmax(precisions))
        met_floor = False

    return {
        "threshold": float(thresholds[best]),
        "precision": float(precisions[best]),
        "recall": float(recalls[best]),
        "met_precision_floor": met_floor,
    }


def main() -> None:
    preprocessing = joblib.load(MODELS_DIR / "preprocessing.pkl")
    imputer, scaler, feature_cols = (
        preprocessing["imputer"], preprocessing["scaler"], preprocessing["feature_columns"]
    )

    test_df = build_features(TEST_CUTOFF)
    X_test_raw, y_test, _ = _prepare_xy(test_df, dummy_columns=feature_cols)
    X_test = pd.DataFrame(imputer.transform(X_test_raw), columns=feature_cols)
    X_test_scaled = scaler.transform(X_test)
    y_test = y_test.to_numpy()

    logreg = joblib.load(MODELS_DIR / "logistic_regression.pkl")
    xgb_model = joblib.load(MODELS_DIR / "xgboost.pkl")

    lr_proba = logreg.predict_proba(X_test_scaled)[:, 1]
    xgb_proba = xgb_model.predict_proba(X_test)[:, 1]

    # ── 1. ROC curves ───────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(7, 6.5))
    for name, proba, color in [("Logistic regression", lr_proba, TEAL), ("XGBoost", xgb_proba, NAVY)]:
        fpr, tpr, _ = roc_curve(y_test, proba)
        ax.plot(fpr, tpr, color=color, linewidth=2, label=f"{name} (AUC={auc(fpr, tpr):.3f})")
    ax.plot([0, 1], [0, 1], color=SLATE, linestyle="--", linewidth=1, label="Random guess")
    ax.set_xlabel("False positive rate")
    ax.set_ylabel("True positive rate")
    ax.set_title("ROC curve")
    ax.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "08_roc_curves.png", dpi=150)
    plt.close(fig)

    # ── 2. Precision-recall curves ──────────────────────────────────────
    fig, ax = plt.subplots(figsize=(7, 6.5))
    for name, proba, color in [("Logistic regression", lr_proba, TEAL), ("XGBoost", xgb_proba, NAVY)]:
        p, r, _ = precision_recall_curve(y_test, proba)
        ax.plot(r, p, color=color, linewidth=2, label=f"{name} (AP={average_precision_score(y_test, proba):.3f})")
    base_rate = y_test.mean()
    ax.axhline(base_rate, color=SLATE, linestyle="--", linewidth=1, label=f"No-skill baseline ({base_rate:.2f})")
    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall curve")
    ax.legend(loc="upper right")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "09_precision_recall_curves.png", dpi=150)
    plt.close(fig)

    # ── 3. Threshold selection + confusion matrix ───────────────────────
    chosen = choose_threshold(y_test, xgb_proba)
    print("=" * 60)
    print("THRESHOLD SELECTION")
    print("=" * 60)
    print("Rule: maximize recall subject to precision >= "
          f"{PRECISION_FLOOR:.2f} — missing a departing member costs more "
          "than a wasted coupon, so precision is the floor, not the target.")
    if not chosen["met_precision_floor"]:
        print(f"WARNING: no threshold reaches precision >= {PRECISION_FLOOR:.2f}; "
              "using the best precision actually achievable instead.")
    print(f"Chosen threshold: {chosen['threshold']:.4f}")
    print(f"  -> precision: {chosen['precision']:.4f}")
    print(f"  -> recall:    {chosen['recall']:.4f}")
    print("=" * 60)

    xgb_pred = (xgb_proba >= chosen["threshold"]).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, xgb_pred).ravel()

    cells = [
        [("True stay", tn, TEAL), ("False alarm", fp, GOLD)],
        [("Missed churn", fn, CORAL), ("Caught churn", tp, NAVY)],
    ]
    fig, ax = plt.subplots(figsize=(6.5, 6))
    for i in range(2):
        for j in range(2):
            label, count, color = cells[i][j]
            ax.add_patch(plt.Rectangle((j, 1 - i), 1, 1, facecolor=color, edgecolor="white", linewidth=2))
            ax.text(j + 0.5, 1 - i + 0.5, f"{label}\n{count:,}", ha="center", va="center",
                     fontsize=13, fontweight="bold", color="white")
    ax.set_xlim(0, 2)
    ax.set_ylim(0, 2)
    ax.set_xticks([0.5, 1.5])
    ax.set_xticklabels(["Predicted: stay", "Predicted: churn"])
    ax.set_yticks([0.5, 1.5])
    ax.set_yticklabels(["Actual: churn", "Actual: stay"])
    ax.set_title(f"XGBoost confusion matrix @ threshold {chosen['threshold']:.2f}")
    ax.grid(False)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "10_confusion_matrix.png", dpi=150)
    plt.close(fig)

    # ── 4. Decile lift chart ────────────────────────────────────────────
    lift_df = pd.DataFrame({
        "churn_proba": xgb_proba,
        "churned": y_test,
        "monetary": test_df["monetary"].values,
    })
    # Revenue at risk = monetary * churn_proba (expected loss), NOT a raw
    # monetary sum. Raw sum was tried first and produced a misleading chart:
    # Champions (huge historical spend, very low churn probability because
    # they're obviously engaged) cluster in the low-risk deciles, and their
    # sheer spend dominated an unweighted sum — decile 10 (lowest risk)
    # showed MORE "at risk" revenue than decile 1. Weighting by probability
    # fixes that: a champion's spend barely counts here because they're very
    # unlikely to actually churn.
    lift_df["expected_loss"] = lift_df["monetary"] * lift_df["churn_proba"]
    # rank descending by probability so decile 1 = highest predicted risk
    lift_df["decile"] = pd.qcut(
        lift_df["churn_proba"].rank(method="first", ascending=False), 10, labels=range(1, 11)
    )
    decile_stats = lift_df.groupby("decile", observed=True).agg(
        churn_rate=("churned", "mean"), revenue_at_risk=("expected_loss", "sum"),
    )

    fig, ax1 = plt.subplots(figsize=(10, 5.5))
    ax1.bar(decile_stats.index.astype(str), decile_stats["churn_rate"] * 100,
             color=NAVY, alpha=0.85, label="Actual churn rate", zorder=2)
    ax1.axhline(base_rate * 100, color=SLATE, linestyle="--", linewidth=1,
                 label=f"Overall rate ({base_rate:.1%})", zorder=1)
    ax1.set_xlabel("Risk decile (1 = highest predicted risk)")
    ax1.set_ylabel("Actual churn rate (%)", color=NAVY)

    ax2 = ax1.twinx()
    ax2.plot(decile_stats.index.astype(str), decile_stats["revenue_at_risk"] / 1000,
              color=CORAL, marker="o", linewidth=2, label="Expected revenue at risk (฿k)", zorder=3)
    ax2.set_ylabel("Expected revenue at risk\n(spend × churn probability, THB thousands)", color=CORAL)
    ax2.grid(False)

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper right")
    ax1.set_title("Decile lift — does risk ranking actually separate churners?")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "11_decile_lift_chart.png", dpi=150)
    plt.close(fig)

    # ── metrics.json ─────────────────────────────────────────────────────
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "train_cutoff": TRAIN_CUTOFF.isoformat(),
        "test_cutoff": TEST_CUTOFF.isoformat(),
        "test_set_size": int(len(y_test)),
        "test_churn_rate": float(base_rate),
        "models": {
            "logistic_regression": {
                "roc_auc": float(auc(*roc_curve(y_test, lr_proba)[:2])),
                "pr_auc": float(average_precision_score(y_test, lr_proba)),
            },
            "xgboost": {
                "roc_auc": float(auc(*roc_curve(y_test, xgb_proba)[:2])),
                "pr_auc": float(average_precision_score(y_test, xgb_proba)),
            },
        },
        "chosen_threshold": {
            "value": chosen["threshold"],
            "precision": chosen["precision"],
            "recall": chosen["recall"],
            "met_precision_floor": chosen["met_precision_floor"],
            "rationale": (
                f"Maximizes recall subject to precision >= {PRECISION_FLOOR:.2f} — "
                "missing a departing member costs more than a wasted coupon."
            ),
        },
        "confusion_matrix": {
            "true_stay": int(tn), "false_alarm": int(fp),
            "missed_churn": int(fn), "caught_churn": int(tp),
        },
        "model_recall": chosen["recall"],  # dashboard KPI convenience field
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))

    print()
    print(f"Saved: {METRICS_PATH}")
    print(f"Confusion matrix @ threshold: caught={tp:,} missed={fn:,} false_alarm={fp:,} true_stay={tn:,}")


if __name__ == "__main__":
    main()
