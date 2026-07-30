"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Segment } from "@/lib/supabase";
import { SEGMENT_ORDER, segmentColor } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { segmentLabel } from "@/lib/i18n/labels";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n";

interface Props {
  segments: Segment[];
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  payload: Record<string, number>;
}

function ChartTooltip({
  active,
  payload,
  locale,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  locale: Locale;
}) {
  if (!active || !payload || payload.length === 0) return null;
  // Recharts includes every stacked series in `payload` on hover; show the
  // one actually under the cursor via the largest value isn't reliable, so
  // instead we rely on Bar's own onMouseOver via dataKey below — simplest
  // robust option is just to list every segment's share here.
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2 shadow-sm text-xs space-y-1">
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: segmentColor(p.dataKey) }}
          />
          <span className="text-ink">{segmentLabel(p.dataKey, locale)}</span>
          <span className="tabular-figures text-ink-muted ml-auto">
            {formatCount(p.value, locale)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SegmentBar({ segments }: Props) {
  const { locale, tf } = useLanguage();
  const bySegment = Object.fromEntries(segments.map((s) => [s.segment, s]));
  const total = segments.reduce((sum, s) => sum + s.size, 0);
  const data = [
    Object.fromEntries([
      ["name", "All members"],
      // Recharts dataKey/legend keys stay the raw English segment name —
      // only the rendered label text is translated (i18n Step 2).
      ...SEGMENT_ORDER.map((name) => [name, bySegment[name]?.size ?? 0]),
    ]),
  ];

  return (
    <div className="rounded-xl border border-line bg-paper p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-4">
        {tf("chart.heading", { count: formatCount(total, locale) })}
      </p>

      <div style={{ width: "100%", height: 64 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            barSize={28}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              content={<ChartTooltip locale={locale} />}
              cursor={{ fill: "transparent" }}
            />
            {SEGMENT_ORDER.map((name) => (
              <Bar
                key={name}
                dataKey={name}
                stackId="a"
                fill={segmentColor(name)}
                radius={0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {SEGMENT_ORDER.map((name) => {
          const s = bySegment[name];
          if (!s) return null;
          return (
            <li key={name} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segmentColor(name) }}
                aria-hidden="true"
              />
              <span className="text-ink">{segmentLabel(name, locale)}</span>
              <span className="tabular-figures text-ink-muted">
                {formatCount(s.size, locale)} ({(s.share * 100).toFixed(0)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
