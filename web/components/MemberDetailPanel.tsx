import type { AtRiskMember } from "@/lib/supabase";
import { riskBadge, segmentColor } from "@/lib/theme";

interface Props {
  member: AtRiskMember | null;
}

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function MemberDetailPanel({ member }: Props) {
  if (!member) {
    return (
      <div className="rounded-xl border border-line bg-paper p-8 h-full flex flex-col items-center justify-center text-center">
        <p className="font-display text-lg text-navy mb-1">Select a member</p>
        <p className="text-sm text-ink-muted max-w-[26ch]">
          Pick anyone from the list to see why they&apos;re at risk and what to do about it.
        </p>
      </div>
    );
  }

  const risk = riskBadge(member.churn_probability);
  const reasons = [member.reason_1, member.reason_2, member.reason_3].filter(
    (r): r is string => !!r
  );

  return (
    <div className="rounded-xl border border-line bg-paper p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display text-xl font-semibold text-navy">{member.member_id}</p>
          <p className="text-sm text-ink-muted mt-0.5">
            {member.tier} ·{" "}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: segmentColor(member.segment) }}
                aria-hidden="true"
              />
              {member.segment}
            </span>
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white tabular-figures"
          style={{ backgroundColor: risk.color }}
        >
          {(member.churn_probability * 100).toFixed(0)}% · {risk.label}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
          Why they&apos;re at risk
        </p>
        <ul className="space-y-1.5">
          {reasons.map((reason, i) => (
            <li key={i} className="text-sm text-ink flex gap-2">
              <span className="text-navy shrink-0">–</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-5 rounded-lg bg-canvas px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-1">
          Recommended action
        </p>
        <p className="text-sm text-ink">{member.recommended_action}</p>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Estimated value protected
        </p>
        <p className="font-display text-lg font-semibold text-navy tabular-figures">
          ฿{thb.format(member.annual_value_thb)}/yr
        </p>
      </div>
    </div>
  );
}
