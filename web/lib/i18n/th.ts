/**
 * Thai dictionary — flat, dot-namespaced keys. Source of truth for the key
 * set: en.ts is typed against `keyof typeof th`, so a missing/extra key in
 * either file fails the TypeScript build (this is how Step 7's "identical
 * key sets" requirement is actually enforced, not just eyeballed).
 *
 * Wording marked "glossary" below is taken verbatim from the approved Thai
 * glossary — do not edit those values without checking with the team.
 */
export const th = {
  // ── Brand / product names — kept in Latin script in both locales ───────
  "brand.overline": "PRIMO Churn Radar",
  "brand.dashboardTitle": "Oberry Member Retention Radar",

  // ── Dashboard header ─────────────────────────────────────────────────
  "dashboard.subtitle": "รายชื่อสมาชิกที่ต้องดูแลวันนี้ เรียงตามมูลค่าที่มีความเสี่ยงจะสูญเสียมากที่สุดก่อน",
  "dashboard.updatedDaily": "อัปเดตทุกวัน", // glossary
  "dashboard.footerNote":
    "ตัวเลขประกอบการนำเสนอ · ข้อมูลจำลอง Oberry เป็นเชนร้านกาแฟสมมติที่ใช้สาธิตระบบทำนายการเลิกใช้งานของ PRIMO",

  // ── KPI row ──────────────────────────────────────────────────────────
  "kpi.activeMembers": "สมาชิกที่ยังใช้งานอยู่", // glossary
  "kpi.flaggedAtRisk": "สมาชิกกลุ่มเสี่ยง", // glossary
  "kpi.flaggedCaptionFiltered": "ตามตัวกรองที่เลือกอยู่",
  "kpi.flaggedCaptionThreshold": "ที่เกณฑ์ซึ่งโมเดลเลือกไว้",
  "kpi.revenueAtRisk": "รายได้ที่มีความเสี่ยง (30 วัน)",
  "kpi.revenueAtRiskCaption": "ยอดใช้จ่ายย้อนหลัง 12 เดือนของสมาชิกกลุ่มเสี่ยง ÷ 12",
  "kpi.modelRecall": "ความครอบคลุมของโมเดล (Recall)", // glossary
  "kpi.modelRecallCaption": "ที่ความแม่นยำ {precision}%",

  // ── At-risk table ────────────────────────────────────────────────────
  "table.emptyTitle": "ไม่มีสมาชิกที่ตรงกับตัวกรองนี้",
  "table.emptyBody": "ลองลดเกณฑ์ความเสี่ยง หรือล้างตัวกรองกลุ่ม/ระดับสมาชิกด้านบน",
  "table.colMember": "สมาชิก",
  "table.colValueAtRisk": "มูลค่าที่มีความเสี่ยง",

  // ── Shared short labels (filter section labels + table headers) ────────
  "common.segment": "กลุ่ม",
  "common.tier": "ระดับ",
  "common.risk": "ความเสี่ยง",
  "common.members": "สมาชิก",

  // ── Filter controls ──────────────────────────────────────────────────
  "controls.filters": "ตัวกรอง",
  "controls.clearFilters": "ล้างตัวกรอง",
  "controls.minRiskToFlag": "เกณฑ์ความเสี่ยงขั้นต่ำที่จะแจ้งเตือน",
  "controls.meetBar": "มีสมาชิกกลุ่มเสี่ยง {visible} จาก {total} คนที่ผ่านเกณฑ์นี้",

  // ── Segment distribution chart ───────────────────────────────────────
  "chart.heading": "สมาชิกแยกตามกลุ่ม — {count} สมาชิก", // "สมาชิกแยกตามกลุ่ม" portion is glossary

  // ── Member detail panel ──────────────────────────────────────────────
  "detail.emptyTitle": "เลือกสมาชิก",
  "detail.emptyBody": "เลือกสมาชิกจากรายการเพื่อดูสาเหตุความเสี่ยงและสิ่งที่ควรทำ",
  "detail.whyAtRisk": "สาเหตุที่มีความเสี่ยง",
  "detail.churnProbability": "โอกาสที่จะเลิกใช้งาน", // glossary
  "detail.valueProtected": "มูลค่าโดยประมาณที่รักษาไว้ได้",
  "detail.englishOriginalNote": "(ต้นฉบับภาษาอังกฤษ)",
  "action.recommended": "การดำเนินการที่แนะนำ", // glossary

  // ── Risk levels — glossary ───────────────────────────────────────────
  "risk.low": "ต่ำ",
  "risk.medium": "ปานกลาง",
  "risk.high": "สูง",
  "risk.veryHigh": "สูงมาก",

  // ── Segments — glossary ──────────────────────────────────────────────
  "segment.champions": "แชมเปี้ยน",
  "segment.loyal": "ลูกค้าประจำ",
  "segment.atRiskRegulars": "ลูกค้าประจำที่กำลังจะหาย",
  "segment.hibernating": "ลูกค้าที่หายไปนาน",
  "segment.oneAndDone": "ซื้อครั้งเดียวแล้วหาย",

  // ── Recommended actions, keyed by segment (see lib/i18n/labels.ts) ──────
  // Not in the approved glossary — translated here for this pass; flag if
  // wording should change.
  "action.champions": "สิทธิพิเศษ VIP, สิทธิ์ทดลองเมนูใหม่ก่อนใคร, ชวนเพื่อนเข้าร่วม",
  "action.loyal": "กระตุ้นให้เลื่อนระดับสมาชิก, เสนอชุดสิทธิพิเศษเฉพาะบุคคล",
  "action.atRiskRegulars": 'คูปองส่วนลด 15% เพื่อดึงกลับ + ภารกิจ LINE "คิดถึงนะ"',
  "action.hibernating": "แจกเครื่องดื่มฟรีเพื่อดึงกลับ + แบบสอบถามสั้น 1 ข้อ",
  "action.oneAndDone": "ภารกิจแนะนำการใช้งาน, กระตุ้นให้กลับมาเยือนครั้งที่สอง",

  // ── Defined for glossary completeness; no current UI call site ─────────
  // (see Step 7 report — not wired up anywhere yet, kept for parity/future use)
  "kpi.daysSinceLastActivity": "จำนวนวันตั้งแต่ใช้งานล่าสุด", // glossary
  "action.launchCampaign": "เริ่มแคมเปญ", // glossary
} as const;
