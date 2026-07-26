"""
Push the processed CSVs + metrics.json into Supabase (PROJECT_BRIEF.md
Prompt 10). The bridge between Tier 1 (Python) and Tier 2 (Supabase) —
this is the only script in the project that writes to the database, and
the only one that ever touches SUPABASE_SERVICE_KEY.

Requires supabase/schema.sql to have already been run in the Supabase SQL
editor. This script only truncates and inserts rows; it never creates
tables, and never touches Row Level Security.

Usage:
    uv run python src/push_to_supabase.py

Required env vars (repo-root .env, python-dotenv):
    SUPABASE_URL
    SUPABASE_SERVICE_KEY    service_role — write access, SECRET. Never used
                            anywhere else in this repo. Never printed.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
PROCESSED = ROOT / "data" / "processed"
METRICS_PATH = ROOT / "outputs" / "metrics.json"

BATCH_SIZE = 1000

# table name -> (source CSV, primary-key column, sentinel value that can
# never match a real row, used to build a delete-all filter since PostgREST
# requires a filter on delete rather than a bare TRUNCATE).
TEXT_PK_TABLES: dict[str, tuple[str, str]] = {
    "members": ("members_scored.csv", "member_id"),
    "at_risk_members": ("at_risk_members.csv", "member_id"),
    "segments": ("segments.csv", "segment"),
    "actions": ("actions.csv", "segment"),
}
NEVER_MATCHES = "__truncate_sentinel__"


def _require_env() -> tuple[str, str]:
    """Validate every precondition up front, before writing anything —
    Prompt 10: fail clearly if credentials are missing, rather than
    half-writing some tables and not others."""
    load_dotenv(ROOT / ".env")
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    missing = [name for name, val in [("SUPABASE_URL", url), ("SUPABASE_SERVICE_KEY", key)] if not val]
    if missing:
        raise SystemExit(
            f"Missing required env var(s): {', '.join(missing)}. "
            f"Copy .env.example to .env at the repo root and fill in real values "
            f"(Supabase -> Settings -> API). Nothing was written."
        )
    return url, key  # type: ignore[return-value]


def _require_files() -> None:
    required = [PROCESSED / csv for csv, _ in TEXT_PK_TABLES.values()] + [METRICS_PATH]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise SystemExit(
            "Missing required input file(s):\n  " + "\n  ".join(missing) +
            "\nRun `make all` (or the individual src/ scripts in order) first. Nothing was written."
        )


def _load_metrics_row() -> dict:
    with open(METRICS_PATH) as f:
        m = json.load(f)
    return {
        "id": 1,
        "generated_at": m["generated_at"],
        "train_cutoff": m["train_cutoff"],
        "test_cutoff": m["test_cutoff"],
        "test_set_size": m["test_set_size"],
        "test_churn_rate": m["test_churn_rate"],
        "lr_roc_auc": m["models"]["logistic_regression"]["roc_auc"],
        "lr_pr_auc": m["models"]["logistic_regression"]["pr_auc"],
        "xgb_roc_auc": m["models"]["xgboost"]["roc_auc"],
        "xgb_pr_auc": m["models"]["xgboost"]["pr_auc"],
        "threshold_value": m["chosen_threshold"]["value"],
        "threshold_precision": m["chosen_threshold"]["precision"],
        "threshold_recall": m["chosen_threshold"]["recall"],
        "threshold_met_precision_floor": m["chosen_threshold"]["met_precision_floor"],
        "threshold_rationale": m["chosen_threshold"]["rationale"],
        "true_stay": m["confusion_matrix"]["true_stay"],
        "false_alarm": m["confusion_matrix"]["false_alarm"],
        "missed_churn": m["confusion_matrix"]["missed_churn"],
        "caught_churn": m["confusion_matrix"]["caught_churn"],
        "model_recall": m["model_recall"],
    }


def _records(csv_name: str) -> list[dict]:
    df = pd.read_csv(PROCESSED / csv_name)
    # NaN isn't valid JSON — Postgres wants a real null instead.
    return json.loads(df.to_json(orient="records"))


def _delete_all(client: Client, table: str, pk_col: str) -> None:
    client.table(table).delete().neq(pk_col, NEVER_MATCHES).execute()


def _insert_batched(client: Client, table: str, records: list[dict]) -> None:
    for start in range(0, len(records), BATCH_SIZE):
        chunk = records[start : start + BATCH_SIZE]
        client.table(table).insert(chunk).execute()


def _verify_count(client: Client, table: str, expected: int) -> int:
    result = client.table(table).select("*", count="exact", head=True).execute()
    actual = result.count
    status = "OK" if actual == expected else "MISMATCH"
    print(f"  {table:<20} expected {expected:>6,}  actual {actual:>6,}  [{status}]")
    if actual != expected:
        raise RuntimeError(
            f"Row-count verification failed for '{table}': expected {expected}, got {actual}. "
            "The table was truncated and re-inserted, but something didn't land — check above for errors."
        )
    return actual


def main() -> None:
    url, key = _require_env()
    _require_files()
    client = create_client(url, key)

    print("Pushing to Supabase — truncate + re-insert, batched at "
          f"{BATCH_SIZE} rows.\n")

    expected_counts: dict[str, int] = {}

    for table, (csv_name, pk_col) in TEXT_PK_TABLES.items():
        records = _records(csv_name)
        print(f"{table}: {len(records):,} rows from {csv_name}")
        _delete_all(client, table, pk_col)
        _insert_batched(client, table, records)
        expected_counts[table] = len(records)

    # metrics: singleton row, id pinned to 1 — delete-then-insert same as
    # the others for consistency, rather than a special-cased upsert.
    metrics_row = _load_metrics_row()
    print(f"metrics: 1 row from {METRICS_PATH.name}")
    _delete_all(client, "metrics", "id")
    client.table("metrics").insert(metrics_row).execute()
    expected_counts["metrics"] = 1

    print("\nVerifying row counts (read-back)...")
    for table, expected in expected_counts.items():
        _verify_count(client, table, expected)

    print("\nAll tables pushed and verified.")


if __name__ == "__main__":
    main()
