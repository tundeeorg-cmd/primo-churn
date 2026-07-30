"use client";

import type { AtRiskMember } from "@/lib/supabase";
import { riskBadge, segmentColor } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  actionLabel,
  riskLevelLabel,
  segmentLabel,
  tierLabel,
} from "@/lib/i18n/labels";
import { formatThb } from "@/lib/i18n/format";

interface Props {
  member: AtRiskMember | null;
}

export default function MemberDetailPanel({ member }: Props) {
  const { locale, t } = useLanguage();

  if (!member) {
    return (
      <div className="rounded-xl border border-line bg-paper p-8 h-full flex flex-col items-center justify-center text-center">
        <p className="font-display text-lg text-navy mb-1">
          {t("detail.emptyTitle")}
        </p>
        <p className="text-sm text-ink-muted max-w-[26ch]">
          {t("detail.emptyBody")}
        </p>
      </div>
    );
  }

  const risk = riskBadge(member.churn_probability);
  const reasons = [member.reason_1, member.reason_2, member.reason_3].filter(
    (r): r is string => !!r,
  );

  return (
    <div className="rounded-xl border border-line bg-paper p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display text-xl font-semibold text-navy">
            {member.member_id}
          </p>
          <p className="text-sm text-ink-muted mt-0.5">
            {tierLabel(member.tier)} ·{" "}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: segmentColor(member.segment) }}
                aria-hidden="true"
              />
              {segmentLabel(member.segment, locale)}
            </span>
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-sm font-semibold text-white tabular-figures text-right"
          style={{ backgroundColor: risk.color }}
          title={t("detail.churnProbability")}
        >
          {(member.churn_probability * 100).toFixed(0)}% ·{" "}
          {riskLevelLabel(risk.label, locale)}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2 flex items-center gap-1.5">
          {t("detail.whyAtRisk")}
          {/* Step 2 / decision A: reason_1-3 are per-member SHAP sentences
              generated in Python with numbers baked in — no finite key
              space for a display-layer dictionary, so these stay English
              with a small note rather than being (mis)translated. */}
          {locale === "th" && (
            <span className="text-[10px] font-normal normal-case text-ink-muted/70">
              {t("detail.englishOriginalNote")}
            </span>
          )}
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
          {t("action.recommended")}
        </p>
        <p className="text-sm text-ink">
          {actionLabel(member.segment, member.recommended_action, locale)}
        </p>
      </div>

      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {t("detail.valueProtected")}
        </p>
        <p className="font-display text-lg font-semibold text-navy tabular-figures">
          {formatThb(member.annual_value_thb, locale)}/
          {locale === "th" ? "ปี" : "yr"}
        </p>
      </div>
    </div>
  );
}
