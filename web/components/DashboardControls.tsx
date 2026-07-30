"use client";

import { SEGMENT_ORDER, segmentColor } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { segmentLabel, tierLabel } from "@/lib/i18n/labels";
import { formatCount } from "@/lib/i18n/format";

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
  const { locale, t, tf } = useLanguage();

  return (
    <div className="rounded-xl border border-line bg-paper p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{t("controls.filters")}</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy rounded"
          >
            {t("controls.clearFilters")}
          </button>
        )}
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">{t("common.segment")}</p>
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
                {segmentLabel(seg, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-muted mb-2">{t("common.tier")}</p>
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
                {tierLabel(tier)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="risk-threshold" className="text-xs text-ink-muted">
            {t("controls.minRiskToFlag")}
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
          {tf("controls.meetBar", {
            visible: formatCount(visibleCount, locale),
            total: formatCount(totalCount, locale),
          })}
        </p>
      </div>
    </div>
  );
}
