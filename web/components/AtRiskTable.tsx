"use client";

import type { AtRiskMember } from "@/lib/supabase";
import { riskBadge, segmentColor } from "@/lib/theme";

interface Props {
  members: AtRiskMember[];
  selectedId: string | null;
  onSelect: (memberId: string) => void;
}

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function AtRiskTable({ members, selectedId, onSelect }: Props) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-8 text-center">
        <p className="font-display text-lg text-navy mb-1">No members match these filters</p>
        <p className="text-sm text-ink-muted">
          Try lowering the risk threshold, or clear a segment/tier filter above.
        </p>
      </div>
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableRowElement>, memberId: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(memberId);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-paper overflow-hidden">
      {/* Bounded, internally-scrolling body — with up to 2,260 rows, an
          unbounded table would make the whole page tens of thousands of
          pixels tall. Sticky header stays visible while scrolling. */}
      <div className="max-h-[70vh] overflow-y-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="sticky top-0 z-10 border-b border-line bg-canvas text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-medium">Member</th>
            <th className="px-4 py-3 font-medium">Tier</th>
            <th className="px-4 py-3 font-medium">Segment</th>
            <th className="px-4 py-3 font-medium text-right">Value at risk</th>
            <th className="px-4 py-3 font-medium text-right">Risk</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const risk = riskBadge(m.churn_probability);
            const selected = m.member_id === selectedId;
            return (
              <tr
                key={m.member_id}
                tabIndex={0}
                aria-selected={selected}
                onClick={() => onSelect(m.member_id)}
                onKeyDown={(e) => handleKeyDown(e, m.member_id)}
                className={`cursor-pointer border-b border-line last:border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy ${
                  selected ? "bg-navy/[0.06]" : "hover:bg-canvas/60"
                }`}
              >
                <td className="px-4 py-3 tabular-figures text-ink">{m.member_id}</td>
                <td className="px-4 py-3 text-ink-muted">{m.tier}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: segmentColor(m.segment) }}
                      aria-hidden="true"
                    />
                    <span className="text-ink-muted">{m.segment}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-figures font-medium text-navy">
                  ฿{thb.format(m.annual_value_thb)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white tabular-figures"
                    style={{ backgroundColor: risk.color }}
                  >
                    {(m.churn_probability * 100).toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
