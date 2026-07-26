"use client";

import { SEGMENT_ORDER, segmentColor } from "@/lib/theme";

const TIERS = ["Bronze", "Silver", "Gold"];

interface Props {
  activeSegments: Set<string>;
  activeTiers: Set<string>;
  onToggleSegment: (segment: string) => void;
  onToggleTier: (tier: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  riskThreshold: number;
  minThreshold: number;
  onThresholdChange: (value: number) => void;
  visibleCount: number;
  totalCount: number;
}

export default function DashboardControls({
  activeSegments,
  activeTiers,
  onToggleSegment,
  onToggleTier,
  onClear,
  hasActiveFilters,
  riskThreshold,
  minThreshold,
  onThresholdChange,
  visibleCount,
  totalCount,
}: Props) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Filters</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy rounded"
          >
            Clear filters
          </button>
        )}
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">Segment</p>
        <div className="flex flex-wrap gap-2">
          {SEGMENT_ORDER.map((seg) => {
            const active = activeSegments.has(seg);
            return (
              <button
                key={seg}
                type="button"
                onClick={() => onToggleSegment(seg)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                  active
                    ? "border-transparent text-white"
                    : "border-line text-ink-muted hover:border-navy/40"
                }`}
                style={active ? { backgroundColor: segmentColor(seg) } : undefined}
              >
                {seg}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">Tier</p>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((tier) => {
            const active = activeTiers.has(tier);
            return (
              <button
                key={tier}
                type="button"
                onClick={() => onToggleTier(tier)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                  active
                    ? "border-navy bg-navy text-white"
                    : "border-line text-ink-muted hover:border-navy/40"
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="risk-threshold" className="text-xs text-ink-muted">
            Minimum risk to flag
          </label>
          <span className="tabular-figures text-xs font-semibold text-navy">
            {(riskThreshold * 100).toFixed(0)}%+
          </span>
        </div>
        <input
          id="risk-threshold"
          type="range"
          min={minThreshold}
          max={0.99}
          step={0.01}
          value={riskThreshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="w-full accent-navy"
        />
        <p className="mt-2 text-xs text-ink-muted">
          <span className="tabular-figures font-medium text-ink">{visibleCount.toLocaleString()}</span> of{" "}
          {totalCount.toLocaleString()} flagged members meet this bar.
        </p>
      </div>
    </div>
  );
}
