"""
Train and compare three churn models (PROJECT_BRIEF.md Prompt 6).

Time-based split, not train_test_split(shuffle=True): features and labels
are built at TWO DIFFERENT cutoffs via features.build_features(), imported
directly rather than duplicated here.

    TRAIN_CUTOFF = 2026-01-31  (11,486 members, 15.3% churned by Mar 31)
    TEST_CUTOFF  = 2026-04-30  (13,892 members, 17.5% churned by Jun 29)

TEST_CUTOFF is also the *latest* cutoff the raw data can support at all —
a churn label needs 60 days of data after the cutoff to resolve, and the
raw transactions end 2026-06-30, so any cutoff later than ~2026-05-01
couldn't be labeled. TRAIN_CUTOFF sits 3 months earlier, giving two
genuinely different point-in-time snapshots of the (overlapping) member
population rather than a random split of rows. It's expected and correct
for the same member to appear in both — what differs is their feature
values as observed at each cutoff, and the 60-day label window that
follows it.

Models:
    1. Majority-class baseline (DummyClassifier)
    2. Logistic regression, scaled features, class_weight="balanced"
    3. XGBoost, scale_pos_weight for the imbalance, RandomizedSearchCV
       over max_depth / learning_rate / n_estimators / subsample

Outputs:
    outputs/models/{baseline,logistic_regression,xgboost}.pkl
    outputs/models/preprocessing.pkl   (imputer, scaler, feature column order)
"""

from __future__ import annotations

import sys
import warnings
from datetime import date
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from scipy.stats import randint, uniform
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, average_precision_score, f1_score,
    precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import build_features  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "outputs" / "models"

RANDOM_STATE = 42
TRAIN_CUTOFF = date(2026, 1, 31)
TEST_CUTOFF = date(2026, 4, 30)

NUMERIC_FEATURES = [
    "recency_days", "frequency", "monetary", "tenure_days",
    "distinct_branches", "home_branch_share", "redemption_count", "points_balance",
    "morning_visit_ratio", "weekend_visit_ratio", "avg_days_between_visits",
    "gap_trend", "visits_last_30d_vs_prev_30d",
]
CATEGORICAL_FEATURES = ["tier"]  # Part D: Gold churns less — worth giving the model directly


def _prepare_xy(df: pd.DataFrame, dummy_columns: list[str] | None = None) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    """Numeric features + one-hot tier. `dummy_columns` (from train) keeps
    train/test aligned even if a tier category is missing from one split."""
    X = df[NUMERIC_FEATURES].copy()
    tier_dummies = pd.get_dummies(df["tier"], prefix="tier")
    X = pd.concat([X, tier_dummies], axis=1)
    if dummy_columns is not None:
        X = X.reindex(columns=dummy_columns, fill_value=0)
    y = df["churned"]
    return X, y, list(X.columns)


def evaluate(name: str, y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> dict:
    return {
        "model": name,
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_proba),
        "pr_auc": average_precision_score(y_true, y_proba),
    }


def main() -> None:
    print(f"Building train features @ {TRAIN_CUTOFF} and test features @ {TEST_CUTOFF} ...")
    train_df = build_features(TRAIN_CUTOFF)
    test_df = build_features(TEST_CUTOFF)
    print(f"  train: {len(train_df):,} members, {train_df['churned'].mean():.1%} churned")
    print(f"  test:  {len(test_df):,} members, {test_df['churned'].mean():.1%} churned")

    X_train_raw, y_train, feature_cols = _prepare_xy(train_df)
    X_test_raw, y_test, _ = _prepare_xy(test_df, dummy_columns=feature_cols)

    # Impute/scale fit on TRAIN only — applying test-set statistics back
    # into either step would leak test-set distribution info into training.
    imputer = SimpleImputer(strategy="median").fit(X_train_raw)
    X_train = pd.DataFrame(imputer.transform(X_train_raw), columns=feature_cols)
    X_test = pd.DataFrame(imputer.transform(X_test_raw), columns=feature_cols)

    scaler = StandardScaler().fit(X_train)
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    results = []
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # ── 1. Majority-class baseline ─────────────────────────────────────
    baseline = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
    pred = baseline.predict(X_test)
    proba = baseline.predict_proba(X_test)[:, 1]
    results.append(evaluate("Majority-class baseline", y_test, pred, proba))
    joblib.dump(baseline, MODELS_DIR / "baseline.pkl")

    # ── 2. Logistic regression, scaled, balanced ───────────────────────
    logreg = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=RANDOM_STATE)
    logreg.fit(X_train_scaled, y_train)
    pred = logreg.predict(X_test_scaled)
    proba = logreg.predict_proba(X_test_scaled)[:, 1]
    results.append(evaluate("Logistic regression", y_test, pred, proba))
    joblib.dump(logreg, MODELS_DIR / "logistic_regression.pkl")

    # ── 3. XGBoost, scale_pos_weight, lightly tuned ────────────────────
    n_pos, n_neg = y_train.sum(), len(y_train) - y_train.sum()
    scale_pos_weight = n_neg / n_pos

    param_dist = {
        "max_depth": randint(3, 9),
        "learning_rate": uniform(0.01, 0.29),
        "n_estimators": randint(100, 501),
        "subsample": uniform(0.6, 0.4),
    }
    xgb_base = XGBClassifier(
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
    )
    search = RandomizedSearchCV(
        xgb_base, param_dist, n_iter=20, scoring="roc_auc",
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE),
        random_state=RANDOM_STATE, n_jobs=-1,
    )
    search.fit(X_train, y_train)
    xgb_model = search.best_estimator_
    print(f"\nXGBoost best params: {search.best_params_}")

    pred = xgb_model.predict(X_test)
    proba = xgb_model.predict_proba(X_test)[:, 1]
    xgb_result = evaluate("XGBoost", y_test, pred, proba)
    results.append(xgb_result)
    joblib.dump(xgb_model, MODELS_DIR / "xgboost.pkl")

    joblib.dump(
        {"imputer": imputer, "scaler": scaler, "feature_columns": feature_cols},
        MODELS_DIR / "preprocessing.pkl",
    )

    # ── Comparison table ────────────────────────────────────────────────
    comparison = pd.DataFrame(results).set_index("model").round(4)
    print("\n" + "=" * 70)
    print("MODEL COMPARISON (test set)")
    print("=" * 70)
    print(comparison.to_string())
    print("=" * 70)

    # If XGBoost is suspiciously good, this almost certainly means a
    # feature leaked post-cutoff information — STOP rather than silently
    # shipping a model that will fail to generalize in production.
    if xgb_result["roc_auc"] > 0.95:
        warnings.warn(
            f"XGBoost ROC-AUC = {xgb_result['roc_auc']:.4f} exceeds the 0.95 leakage "
            "threshold (Part F). Investigate for leakage before trusting this model.",
            stacklevel=2,
        )
        raise RuntimeError(
            f"XGBoost ROC-AUC ({xgb_result['roc_auc']:.4f}) exceeds 0.95 — stopping per "
            "PROJECT_BRIEF.md Part F #6 instead of proceeding with a likely-leaky model."
        )


if __name__ == "__main__":
    main()
