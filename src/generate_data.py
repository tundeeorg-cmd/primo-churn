"""
Generate Oberry's synthetic loyalty dataset (PROJECT_BRIEF.md Part D).

Each member is simulated individually: a latent behavior type drives their
visit cadence, and a subset of members are walked through a decay phase
(widening inter-visit gaps, shrinking baskets, scattering across branches)
before going silent. Rows are not sampled independently — the point of this
generator is that the temporal structure churn models actually key off
(gap_trend, basket shrinkage, branch loyalty breakdown) is real in the raw
data, not bolted on afterward.

Outputs:
    data/raw/members.csv
    data/raw/transactions.csv

Seed: 42.
"""

# Author: Jenissa Vichiansin — International School Bangkok

from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
rng = np.random.default_rng(SEED)

N_MEMBERS = 20_000
WINDOW_START = date(2024, 7, 1)
WINDOW_END = date(2026, 6, 30)
WINDOW_DAYS = (WINDOW_END - WINDOW_START).days
CHURN_SILENCE_DAYS = 60

OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"

# ── Branches — ~40, concentrated in Bangkok like a real Thai café chain ──────
_CITY_COUNTS = [("Bangkok", 24), ("Chiang Mai", 5), ("Phuket", 4), ("Pattaya", 4), ("Khon Kaen", 3)]
BRANCHES = []
_idx = 1
for city, n in _CITY_COUNTS:
    for _ in range(n):
        BRANCHES.append((f"B{_idx:02d}", city))
        _idx += 1
BRANCH_IDS = [b for b, _ in BRANCHES]
BRANCH_CITY = dict(BRANCHES)

AGE_BANDS = ["18-24", "25-34", "35-44", "45-54", "55+"]
AGE_BAND_WEIGHTS = [0.20, 0.35, 0.25, 0.13, 0.07]

ITEM_CATEGORIES = ["Coffee", "Tea", "Pastry", "Light Meal", "Seasonal Special", "Merchandise"]
ITEM_CATEGORY_WEIGHTS = [0.45, 0.15, 0.20, 0.12, 0.06, 0.02]

TIERS = ["Bronze", "Silver", "Gold"]
TIER_WEIGHTS = [0.60, 0.30, 0.10]
TIER_BASKET_MULT = {"Bronze": 1.00, "Silver": 1.15, "Gold": 1.35}
TIER_CHURN_MULT = {"Bronze": 1.05, "Silver": 1.00, "Gold": 0.55}  # Gold churns less

BEHAVIOR_TYPES = ["champion", "loyal", "casual"]
BEHAVIOR_WEIGHTS = [0.03, 0.27, 0.70]  # kept small — at true 3-5x/week even a
# modest champion share would blow past ~300k transactions over a 2-year window
BEHAVIOR_GAP_DAYS = {
    "champion": (1.4, 2.3),  # 3-5x / week
    "loyal": (5.5, 8.5),  # ~1x / week
    "casual": (14.0, 32.0),  # 1-2x / month
}

WIN_BACK_PROB = 0.35  # chance a fully-decayed member gets one surprise
# reactivation visit instead of going silent for good — see the loop below
ANOMALOUS_GAP_PROB = 0.07  # chance any single *normal-cadence* gap is
# stretched (vacation, one-off disinterest) without signaling real risk

BASE_CHURN_PROB = 0.66  # tuned against TIER_CHURN_MULT so the *observed*
# 60-day-silence rate lands in 22-28%; see the validation summary at the end

SIGNUP_SKEW = 2.0  # Beta(SIGNUP_SKEW, 1) skews signups toward recent dates —
# a growing loyalty program, and it keeps the average member's active window
# short enough that literal champion/loyal cadences don't blow the ~300k
# transaction budget on their own


def seasonal_multiplier(d: date) -> float:
    """Rainy season (Jul-Sep) thins visits out; December brings them back."""
    if d.month in (7, 8, 9):
        return 1.20
    if d.month == 12:
        return 0.78
    return 1.0


def sample_hour(is_weekend: bool) -> int:
    """Weekday 7-10am peak; weekend afternoon peak."""
    if is_weekend:
        if rng.random() < 0.55:
            return int(np.clip(rng.normal(14, 2), 8, 21))
        return int(rng.integers(7, 22))
    if rng.random() < 0.55:
        return int(np.clip(rng.normal(8.5, 1.2), 6, 22))
    return int(rng.integers(6, 22))


def pick_branch(home_branch: str, in_decay: bool) -> str:
    """Branch loyalty breaks down as an at-risk member's decay progresses."""
    other_prob = 0.28 if in_decay else 0.12
    if rng.random() < other_prob:
        others = [b for b in BRANCH_IDS if b != home_branch]
        return others[rng.integers(0, len(others))]
    return home_branch


def sample_amount(tier: str, shrink_mult: float) -> float:
    """Log-normal basket, median ~145 THB, occasional 400-900 group orders."""
    if rng.random() < 0.08:
        base = rng.uniform(400, 900)
    else:
        # 134, not 145 — the tier multiplier below (avg ~1.08x across the
        # Bronze/Silver/Gold mix) and the 8% group-order mixture both pull
        # the realized median up; targeting 134 here lands the *overall*
        # median at Part D's stated ~145 after those effects.
        base = min(rng.lognormal(np.log(134), 0.42), 380)
    return round(base * TIER_BASKET_MULT[tier] * shrink_mult, 2)


def simulate_member(member_idx: int) -> tuple[dict, list[dict]]:
    member_id = f"M{member_idx:06d}"

    tier = TIERS[rng.choice(len(TIERS), p=TIER_WEIGHTS)]
    home_branch = BRANCH_IDS[rng.integers(0, len(BRANCH_IDS))]
    age_band = AGE_BANDS[rng.choice(len(AGE_BANDS), p=AGE_BAND_WEIGHTS)]
    behavior = BEHAVIOR_TYPES[rng.choice(len(BEHAVIOR_TYPES), p=BEHAVIOR_WEIGHTS)]
    gap_lo, gap_hi = BEHAVIOR_GAP_DAYS[behavior]
    base_gap = rng.uniform(gap_lo, gap_hi)

    signup_offset = int(rng.beta(SIGNUP_SKEW, 1.0) * WINDOW_DAYS)
    signup_date = WINDOW_START + timedelta(days=signup_offset)

    will_churn = rng.random() < min(1.0, BASE_CHURN_PROB * TIER_CHURN_MULT[tier])
    # Never-redeemers churn more: bake the correlation directly into the
    # generation odds rather than deriving it after the fact.
    redeems = rng.random() < (0.22 if will_churn else 0.60)

    # Onboarding effect: members whose 2nd purchase lands >21 days after the
    # 1st churn more often — give churners a wider first-gap distribution.
    first_gap = rng.uniform(10, 40) if will_churn else rng.uniform(3, 18)

    # Decay onset. Decay itself is defined in VISITS, not calendar days (see
    # the main loop below) — a fixed 28-56 *day* window would barely fit one
    # visit for a casual member (base gap up to 32 days), so it wouldn't be
    # able to show a widening trend at all before hitting the ceiling.
    remaining = WINDOW_DAYS - signup_offset
    can_decay = will_churn and remaining > 45
    if can_decay:
        # Bias onset into the first half of remaining runway, so there's
        # room left for decay *and* the trailing silence that actually
        # triggers the 60-day churn label — not just decay itself.
        onset_lo = 30
        onset_hi = max(onset_lo + 1, int(remaining * 0.5))
        churn_onset_offset = signup_offset + int(rng.integers(onset_lo, onset_hi))
        decay_steps_total = int(rng.integers(3, 6))  # a handful of decaying visits
    else:
        churn_onset_offset = None
        decay_steps_total = None

    points_balance = 0
    visits: list[dict] = []
    txn_seq = 0

    def record_visit(visit_date: date, in_decay: bool, shrink_mult: float) -> None:
        nonlocal points_balance, txn_seq
        txn_seq += 1
        is_weekend = visit_date.weekday() >= 5
        dt = datetime.combine(visit_date, datetime.min.time()) + timedelta(
            hours=sample_hour(is_weekend), minutes=int(rng.integers(0, 60))
        )
        amount = sample_amount(tier, shrink_mult)
        branch = pick_branch(home_branch, in_decay)
        earned = int(amount // 10)
        points_balance += earned
        redeemed = 0
        if redeems and points_balance >= 100 and rng.random() < 0.12:
            redeemed = int(rng.integers(50, min(300, points_balance) + 1))
            points_balance -= redeemed
        category = ITEM_CATEGORIES[rng.choice(len(ITEM_CATEGORIES), p=ITEM_CATEGORY_WEIGHTS)]
        visits.append(
            {
                "transaction_id": f"T{member_idx:06d}{txn_seq:03d}",
                "member_id": member_id,
                "transaction_date": dt.isoformat(sep=" "),
                "branch_id": branch,
                "amount_thb": amount,
                "points_earned": earned,
                "points_redeemed": redeemed,
                "item_category": category,
            }
        )

    # First visit — signup and first purchase coincide (point-of-sale enrollment).
    record_visit(signup_date, in_decay=False, shrink_mult=1.0)
    current_offset = signup_offset

    # Second visit, using the onboarding-effect first_gap.
    next_offset = current_offset + first_gap
    if next_offset > WINDOW_DAYS:
        return (
            _member_row(
                member_id, signup_date, tier, home_branch, age_band, city=BRANCH_CITY[home_branch]
            ),
            visits,
        )
    current_offset = next_offset
    record_visit(WINDOW_START + timedelta(days=current_offset), in_decay=False, shrink_mult=1.0)

    # Remaining visits.
    decay_step = 0
    while True:
        in_decay = can_decay and current_offset >= churn_onset_offset
        cur_date = WINDOW_START + timedelta(days=current_offset)
        season_mult = seasonal_multiplier(cur_date)

        if in_decay:
            # Each decay-phase visit widens the gap further and shrinks the
            # basket further — guaranteed to happen over `decay_steps_total`
            # actual visits, regardless of how fast or slow this member's
            # normal cadence is.
            widen = 1.0 + 2.0 * (decay_step / decay_steps_total)  # up to ~3.0x by the last step
            shrink_mult = 1.0 - 0.20 * (decay_step / decay_steps_total)  # up to ~20% smaller basket
            gap = base_gap * widen * season_mult * rng.uniform(0.85, 1.15)
        else:
            shrink_mult = 1.0
            jitter = rng.uniform(0.7, 1.3)
            if rng.random() < ANOMALOUS_GAP_PROB:
                jitter *= rng.uniform(2.5, 5.0)  # one-off stretch, not a churn signal
            gap = base_gap * jitter * season_mult

        next_offset = current_offset + gap

        if next_offset > WINDOW_DAYS:
            break  # censored at window end (mid-decay or not)

        current_offset = next_offset
        record_visit(
            WINDOW_START + timedelta(days=current_offset),
            in_decay=in_decay,
            shrink_mult=shrink_mult,
        )

        if in_decay:
            decay_step += 1
            if decay_step >= decay_steps_total:
                # Real customers sometimes come back even after drifting
                # away — a decay that *always* ends in permanent silence
                # makes churn perfectly predictable from pre-decay signal
                # alone (Part D: "If the model scores above 0.95 ROC-AUC,
                # churn has been made too easy to predict — add noise").
                # Give a minority of decayed members one surprise
                # reactivation visit before truly going quiet.
                if rng.random() < WIN_BACK_PROB:
                    winback_offset = current_offset + rng.uniform(20, 150)
                    if winback_offset <= WINDOW_DAYS:
                        record_visit(
                            WINDOW_START + timedelta(days=winback_offset),
                            in_decay=False,
                            shrink_mult=1.0,
                        )
                break  # decay (and any win-back) complete — silent for the rest of the window

    member_row = _member_row(
        member_id, signup_date, tier, home_branch, age_band, city=BRANCH_CITY[home_branch]
    )
    return member_row, visits


def _member_row(member_id, signup_date, tier, home_branch, age_band, city) -> dict:
    return {
        "member_id": member_id,
        "signup_date": signup_date.isoformat(),
        "tier": tier,
        "home_branch": home_branch,
        "age_band": age_band,
        "city": city,
    }


def main() -> None:
    members: list[dict] = []
    transactions: list[dict] = []

    for i in range(1, N_MEMBERS + 1):
        member_row, visits = simulate_member(i)
        members.append(member_row)
        transactions.extend(visits)

    members_df = pd.DataFrame(members)
    txn_df = pd.DataFrame(transactions)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    members_df.to_csv(OUT_DIR / "members.csv", index=False)
    txn_df.to_csv(OUT_DIR / "transactions.csv", index=False)

    _print_validation_summary(members_df, txn_df)


def _print_validation_summary(members_df: pd.DataFrame, txn_df: pd.DataFrame) -> None:
    txn_df = txn_df.copy()
    txn_df["transaction_date"] = pd.to_datetime(txn_df["transaction_date"])
    window_end_ts = pd.Timestamp(WINDOW_END) + pd.Timedelta(days=1)  # inclusive of 2026-06-30

    last_txn = txn_df.groupby("member_id")["transaction_date"].max()
    days_silent = (window_end_ts - last_txn).dt.days
    churned = days_silent > CHURN_SILENCE_DAYS
    churn_rate = churned.mean()

    # gap_trend = recent gap ÷ each member's own historical baseline gap
    # (the feature Part D names as the expected strongest early-warning
    # signal). A raw population-wide gap average is dominated by behavior-
    # type heterogeneity — a decaying champion's widened gap can still look
    # tiny next to a normal casual member's baseline — so it's the ratio to
    # each member's *own* history, not the absolute gap, that should differ.
    def gap_trend(dates: pd.Series) -> float:
        d = dates.sort_values()
        if len(d) < 2:
            return np.nan
        gaps = d.diff().dt.total_seconds().div(86400).dropna()
        recent = gaps.tail(3)
        historical = gaps.iloc[: max(0, len(gaps) - 3)]
        if len(historical) == 0:
            return np.nan
        return recent.mean() / historical.mean()

    trends = txn_df.groupby("member_id")["transaction_date"].apply(gap_trend)
    trend_by_churn = trends.groupby(churned.reindex(trends.index)).mean()

    print("=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Members:               {len(members_df):,}")
    print(f"Transactions:          {len(txn_df):,}")
    print(
        f"Date range:            {txn_df['transaction_date'].min()} -> {txn_df['transaction_date'].max()}"
    )
    print(f"Churn rate (60d rule): {churn_rate:.1%}  (target 22-28%)")
    print()
    print("Tier distribution:")
    print(members_df["tier"].value_counts(normalize=True).mul(100).round(1).to_string())
    print()
    print(f"Basket mean:           {txn_df['amount_thb'].mean():.2f} THB")
    print(f"Basket median:         {txn_df['amount_thb'].median():.2f} THB")
    print()
    print("Mean gap_trend (recent gap / historical gap), churned vs not:")
    print(trend_by_churn.rename(index={True: "churned", False: "active"}).round(2).to_string())
    print("=" * 60)


if __name__ == "__main__":
    main()
