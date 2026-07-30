"""
K-means segmentation of members on RFM (PROJECT_BRIEF.md Prompt 5).

Cluster -> segment name mapping is derived from each cluster's own RFM
profile, never from a hardcoded cluster index — K-means label order is
arbitrary and isn't guaranteed stable if the upstream feature table
changes (different member count, different cutoff, etc).

Outputs:
    outputs/figures/06_kmeans_elbow_silhouette.png
    outputs/figures/07_segment_bubble_chart.png
    data/processed/features.csv   (adds `cluster`, `segment` columns)
    data/processed/segments.csv   (one row per segment: profile + share)
"""

# Author: Jenissa Vichiansin — International School Bangkok

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent.parent
PROCESSED = ROOT / "data" / "processed"
FIG_DIR = ROOT / "outputs" / "figures"

RANDOM_STATE = 42

NAVY, TEAL, GOLD, CORAL, SLATE = "#1F3B57", "#2E8B7A", "#D4A03C", "#D65C4A", "#5B7C99"
SEGMENT_COLORS = {
    "Champions": NAVY,
    "Loyal": TEAL,
    "At-risk regulars": GOLD,
    "Hibernating": CORAL,
    "One-and-done": SLATE,
}

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


def sweep_k(X: np.ndarray, ks: range) -> tuple[list[float], list[float]]:
    inertias, silhouettes = [], []
    for k in ks:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit(X)
        inertias.append(km.inertia_)
        silhouettes.append(silhouette_score(X, km.labels_))
    return inertias, silhouettes


def assign_segment_names(profile: pd.DataFrame) -> dict[int, str]:
    """Rank-based, order-independent mapping from cluster profile -> name.

    Assigned greedily, most-distinctive-signal first, removing each
    matched cluster from the pool so no name or cluster is used twice:
      1. One-and-done  — lowest mean frequency (barely more than one visit)
      2. Hibernating    — highest mean recency among what's left (long-silent)
      3. Champions      — highest mean monetary among what's left (top spenders)
      4. Loyal          — of the remaining two, the more recently active
      5. At-risk regulars — the other one (was regular, now drifting)
    """
    remaining = list(profile.index)
    mapping: dict[int, str] = {}

    one_and_done = profile.loc[remaining, "frequency"].idxmin()
    mapping[one_and_done] = "One-and-done"
    remaining.remove(one_and_done)

    hibernating = profile.loc[remaining, "recency_days"].idxmax()
    mapping[hibernating] = "Hibernating"
    remaining.remove(hibernating)

    champions = profile.loc[remaining, "monetary"].idxmax()
    mapping[champions] = "Champions"
    remaining.remove(champions)

    loyal = profile.loc[remaining, "recency_days"].idxmin()
    mapping[loyal] = "Loyal"
    remaining.remove(loyal)

    at_risk = remaining[0]
    mapping[at_risk] = "At-risk regulars"

    return mapping


def main() -> None:
    df = pd.read_csv(PROCESSED / "features.csv")

    rfm = df[["recency_days", "frequency", "monetary"]].copy()
    # log1p on frequency/monetary — both are heavily right-skewed (monetary's
    # max is ~50x its median), so raw values would let a handful of whale
    # spenders dominate K-means' Euclidean distance metric.
    rfm["frequency"] = np.log1p(rfm["frequency"])
    rfm["monetary"] = np.log1p(rfm["monetary"])
    X = StandardScaler().fit_transform(rfm)

    ks = range(2, 9)
    inertias, silhouettes = sweep_k(X, ks)

    print("k sweep:")
    for k, i, s in zip(ks, inertias, silhouettes):
        print(f"  k={k}  inertia={i:9.1f}  silhouette={s:.4f}")

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))
    axes[0].plot(list(ks), inertias, color=NAVY, marker="o")
    axes[0].set_xlabel("k")
    axes[0].set_ylabel("Inertia")
    axes[0].set_title("Elbow")
    axes[1].plot(list(ks), silhouettes, color=TEAL, marker="o")
    axes[1].set_xlabel("k")
    axes[1].set_ylabel("Silhouette score")
    axes[1].set_title("Silhouette")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "06_kmeans_elbow_silhouette.png", dpi=150)
    plt.close(fig)

    # SELECTED_K = 5, not the silhouette-maximizing k=3 (0.4228 vs 0.3666 at
    # k=5). Silhouette is a pure geometric compactness/separation score on
    # standardized RFM — it has no notion of business usefulness. Inertia's
    # marginal gains clearly taper by k=5 (k=2->5 cuts inertia 66%; k=5->8
    # only cuts a further 37% on top of that, over three more clusters), so
    # most of the real structure is already captured. 0.3666 is still a
    # healthy silhouette for real-world RFM data, not a degenerate one — and
    # k=5 is what maps cleanly onto the five actionable segments Part C asks
    # for (Champions / Loyal / At-risk regulars / Hibernating / One-and-done),
    # which for a churn-intervention tool matters more than chasing the last
    # bit of statistical separation.
    SELECTED_K = 5

    km = KMeans(n_clusters=SELECTED_K, random_state=RANDOM_STATE, n_init=10).fit(X)
    df["cluster"] = km.labels_

    profile = df.groupby("cluster").agg(
        recency_days=("recency_days", "mean"),
        frequency=("frequency", "mean"),
        monetary=("monetary", "mean"),
        tenure_days=("tenure_days", "mean"),
        size=("cluster", "size"),
    )
    profile["share"] = profile["size"] / profile["size"].sum()

    name_map = assign_segment_names(profile)
    df["segment"] = df["cluster"].map(name_map)
    profile["segment"] = profile.index.map(name_map)

    print()
    print("Cluster profiles:")
    print(profile.round(1).to_string())

    # ── Bubble chart: recency (x), frequency (y), bubble size = mean spend ──
    # Labels sit ABOVE each bubble (offset by that bubble's own radius, in
    # points) rather than inside it — cramming "At-risk regulars" or
    # "Hibernating" inside a small circle just clips the text. Axis limits
    # get generous manual padding too, since the biggest bubble (Champions)
    # sits right at the recency/frequency extremes and would otherwise spill
    # past the plot edge.
    fig, ax = plt.subplots(figsize=(9.5, 7))
    max_monetary = profile["monetary"].max()
    for _, row in profile.iterrows():
        size = 300 + 3200 * (row["monetary"] / max_monetary)
        radius_pts = (size / np.pi) ** 0.5
        ax.scatter(
            row["recency_days"],
            row["frequency"],
            s=size,
            color=SEGMENT_COLORS[row["segment"]],
            alpha=0.75,
            edgecolors="white",
            linewidth=1.5,
            zorder=3,
        )
        ax.annotate(
            f"{row['segment']} ({row['share']:.0%})",
            (row["recency_days"], row["frequency"]),
            xytext=(0, radius_pts + 10),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=10,
            fontweight="bold",
            color=SEGMENT_COLORS[row["segment"]],
            zorder=4,
        )

    x_pad = max(profile["recency_days"].max() * 0.15, 5)
    ax.set_xlim(profile["recency_days"].min() - x_pad, profile["recency_days"].max() + x_pad)
    ax.set_ylim(0, profile["frequency"].max() * 1.35)
    ax.set_xlabel("Mean recency (days since last visit)")
    ax.set_ylabel("Mean frequency (visits)")
    ax.set_title("Segments — position by recency/frequency, size by mean spend")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "07_segment_bubble_chart.png", dpi=150)
    plt.close(fig)

    # ── Save outputs ────────────────────────────────────────────────────
    df.to_csv(PROCESSED / "features.csv", index=False)

    segments_out = profile.reset_index()[
        [
            "segment",
            "cluster",
            "size",
            "share",
            "recency_days",
            "frequency",
            "monetary",
            "tenure_days",
        ]
    ].sort_values("share", ascending=False)
    segments_out.to_csv(PROCESSED / "segments.csv", index=False)

    print()
    print(f"Updated: {PROCESSED / 'features.csv'} (+cluster, +segment)")
    print(f"Saved:   {PROCESSED / 'segments.csv'}")


if __name__ == "__main__":
    main()
