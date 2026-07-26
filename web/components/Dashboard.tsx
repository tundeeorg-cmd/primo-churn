"use client";

import { useMemo, useState } from "react";
import type { AtRiskMember, Metrics, Segment } from "@/lib/supabase";
import AtRiskTable from "./AtRiskTable";
import DashboardControls from "./DashboardControls";
import KpiRow from "./KpiRow";
import MemberDetailPanel from "./MemberDetailPanel";
import SegmentBar from "./SegmentBar";

interface Props {
  atRiskMembers: AtRiskMember[];
  segments: Segment[];
  metrics: Metrics | null;
  activeMemberCount: number;
}

const thbCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export default function Dashboard({ atRiskMembers, segments, metrics, activeMemberCount }: Props) {
  const minThreshold = metrics?.threshold_value ?? 0.5;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSegments, setActiveSegments] = useState<Set<string>>(new Set());
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set());
  const [riskThreshold, setRiskThreshold] = useState(minThreshold);

  // Segment/tier filters applied, but not the risk threshold — this is the
  // baseline the threshold slider's "N of M meet this bar" stat is actually
  // measured against, so that stat stays meaningful when a segment/tier
  // filter is also active (otherwise "meet this bar" would compare against
  // the whole 2,260, even while looking at Hibernating alone).
  const segmentTierFiltered = useMemo(() => {
    return atRiskMembers.filter(
      (m) =>
        (activeSegments.size === 0 || activeSegments.has(m.segment)) &&
        (activeTiers.size === 0 || activeTiers.has(m.tier))
    );
  }, [atRiskMembers, activeSegments, activeTiers]);

  const filtered = useMemo(() => {
    return segmentTierFiltered.filter(
      (m) =>
        // At the default slider position, trust Python's flagging as-is —
        // every row here already cleared `>= minThreshold` there. Re-checking
        // that same comparison against a float64 threshold re-read from
        // Supabase risks excluding a member whose probability came back as
        // float32 (predict_proba's dtype) and round-trips a hair below the
        // float64 value despite passing in the original comparison. Only
        // apply this filter once the operator actually raises the bar.
        riskThreshold <= minThreshold || m.churn_probability >= riskThreshold
    );
  }, [segmentTierFiltered, riskThreshold, minThreshold]);

  const selectedMember = filtered.find((m) => m.member_id === selectedId) ?? null;

  const revenueAtRisk30d = useMemo(
    () => filtered.reduce((sum, m) => sum + m.annual_value_thb, 0) / 12,
    [filtered]
  );

  function toggleSegment(segment: string) {
    setActiveSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segment)) next.delete(segment);
      else next.add(segment);
      return next;
    });
  }

  function toggleTier(tier: string) {
    setActiveTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  function clearFilters() {
    setActiveSegments(new Set());
    setActiveTiers(new Set());
    setRiskThreshold(minThreshold);
  }

  const hasActiveFilters =
    activeSegments.size > 0 || activeTiers.size > 0 || riskThreshold !== minThreshold;

  return (
    <div className="space-y-6">
      <KpiRow
        items={[
          { label: "Active members", value: activeMemberCount.toLocaleString() },
          {
            label: "Flagged at-risk",
            value: filtered.length.toLocaleString(),
            caption: hasActiveFilters ? "matching current filters" : "at the model's chosen threshold",
          },
          {
            label: "Revenue at risk (30d)",
            value: `฿${thbCompact.format(revenueAtRisk30d)}`,
            caption: "trailing-12mo spend of flagged members ÷ 12",
          },
          {
            label: "Model recall",
            value: metrics ? `${(metrics.model_recall * 100).toFixed(0)}%` : "—",
            caption: metrics ? `at ${(metrics.threshold_precision * 100).toFixed(0)}% precision` : undefined,
          },
        ]}
      />

      <DashboardControls
        activeSegments={activeSegments}
        activeTiers={activeTiers}
        onToggleSegment={toggleSegment}
        onToggleTier={toggleTier}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        riskThreshold={riskThreshold}
        minThreshold={minThreshold}
        onThresholdChange={setRiskThreshold}
        visibleCount={filtered.length}
        totalCount={segmentTierFiltered.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <AtRiskTable members={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="lg:sticky lg:top-6">
          <MemberDetailPanel member={selectedMember} />
        </div>
      </div>

      <SegmentBar segments={segments} />
    </div>
  );
}
