"use client";

import type { AtRiskMember } from "@/lib/supabase";
import { riskBadge, segmentColor } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { segmentLabel, tierLabel } from "@/lib/i18n/labels";
import { formatThb } from "@/lib/i18n/format";

interface Props {
  members: AtRiskMember[];
  selectedId: string | null;
  onSelect: (memberId: string) => void;
}

export default function AtRiskTable({ members, selectedId, onSelect }: Props) {
  const { locale, t } = useLanguage();

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-paper p-8 text-center">
        <p className="font-display text-lg text-navy mb-1">{t("table.emptyTitle")}</p>
        <p className="text-sm text-ink-muted">{t("table.emptyBody")}</p>
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
            <th className="px-4 py-3 font-medium">{t("table.colMember")}</th>
            <th className="px-4 py-3 font-medium">{t("common.tier")}</th>
            <th className="px-4 py-3 font-medium">{t("common.segment")}</th>
            <th className="px-4 py-3 font-medium text-right">{t("table.colValueAtRisk")}</th>
            <th className="px-4 py-3 font-medium text-right">{t("common.risk")}</th>
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
                <td className="px-4 py-3 text-ink-muted">{tierLabel(m.tier)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: segmentColor(m.segment) }}
                      aria-hidden="true"
                    />
                    <span className="text-ink-muted">{segmentLabel(m.segment, locale)}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-figures font-medium text-navy">
                  {formatThb(m.annual_value_thb, locale)}
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
