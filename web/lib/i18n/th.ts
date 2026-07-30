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

  // ── Shared footer note (both / and /dashboard) ──────────────────────────
  "footer.syntheticNote":
    "ตัวเลขประกอบการนำเสนอ · ข้อมูลจำลอง Oberry เป็นเชนร้านกาแฟสมมติที่ใช้สาธิตระบบทำนายการเลิกใช้งานของ PRIMO",
  "footer.sourceOnGithub": "ดูซอร์สโค้ดบน GitHub",

  // ── Shared nav / CTA ─────────────────────────────────────────────────
  // Arrow is a separate aria-hidden span at each call site (tundee.org's
  // pattern — Part B0), not baked into the translated string.
  "nav.openRadar": "เปิดเรดาร์", // glossary

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

  // ═══════════════════════════════════════════════════════════════════════
  // Landing page (/) — Part A1. Translated properly, not machine-translated;
  // flag any wording that should change.
  // ═══════════════════════════════════════════════════════════════════════

  // ── Hero ─────────────────────────────────────────────────────────────
  "hero.headline": "ใครกำลังจะจากไป?",
  "hero.narrativeStory":
    "ลูกค้าคนหนึ่งแวะมาทุกวันอังคารติดต่อกันแปดเดือน แล้ววันอังคารก็กลายเป็นวันพฤหัสฯ จากนั้นก็เว้นสัปดาห์เว้นสัปดาห์ แล้วก็เงียบไปเลย — หกสิบวันแห่งความเงียบ กว่า Oberry จะสังเกตเห็นว่าเธอหายไปแล้ว",
  "hero.narrativeConclusion":
    "ช่องว่างที่ค่อยๆ ถ่างออกนั้นแหละคือสัญญาณที่ระบบทั้งหมดนี้ถูกสร้างมาเพื่อจับให้ได้ ก่อนการมาเยือนครั้งสุดท้ายเป็นสัปดาห์ ไม่ใช่การหายไปแบบฉับพลัน และไม่ใช่ตัวเลขก้อนใหญ่พร้อมพื้นหลังไล่สี",
  "hero.sparklineAriaLabel":
    "ลำดับการมาเยือนที่ถี่ติดกัน ค่อยๆ ห่างออก แล้วเงียบหายไปเป็นเวลานาน",
  "hero.sixtyDaysSilent": "เงียบไป 60 วัน", // glossary

  // ── Problem ──────────────────────────────────────────────────────────
  "problem.heading": "ปัญหาเงียบๆ ที่ซ่อนอยู่ในทุกโปรแกรมสมาชิก",
  "problem.para1":
    "“Churn” หรือการเลิกใช้งาน หมายความง่ายๆ ว่าสมาชิกที่เคยกลับมาใช้บริการเป็นประจำหยุดกลับมา — ไม่มีการยกเลิก ไม่มีการร้องเรียน ไม่มีอะไรที่ดูน่าตกใจ สำหรับเชนร้านกาแฟที่ธุรกิจตั้งอยู่บนการกลับมาซ้ำของลูกค้า นี่คือโมเดลธุรกิจทั้งหมดที่กำลังรั่วไหลออกไปอย่างเงียบๆ ทีละคน โดยไม่มีสัญญาณเตือนภัยดังขึ้นที่ไหนเลย",
  "problem.para2":
    "ปัญหาอยู่ที่จังหวะเวลา กว่าที่เจ้าของร้านจะสังเกตว่าลูกค้าประจำหายไปสองเดือนแล้ว การดึงกลับมาก็แพงกว่าการทักทายตั้งแต่ตอนที่เขาเพิ่งเริ่มห่างหายไปมาก ระบบทำนายจะพลิกสถานการณ์นี้กลับด้าน โดยจับสัญญาณตั้งแต่เนิ่นๆ — การมาเยือนที่ห่างขึ้น การใช้จ่ายที่ลดลง — แล้วตั้งค่าสถานะสมาชิกไว้ในขณะที่ยังมีเวลาทำอะไรได้",

  // ── How it works ─────────────────────────────────────────────────────
  "howItWorks.heading": "วิธีการทำงาน",
  "pipeline.01.title": "เรียนรู้จากข้อมูลการใช้บริการ 2 ปี",
  "pipeline.01.body":
    "ทุกการซื้อ ทุกสาขา และการแลกแต้มของสมาชิกราว 20,000 คน ถูกป้อนเข้าโมเดล — จังหวะการใช้ชีวิตปกติของเชนร้านกาแฟตลอด 24 เดือน",
  "pipeline.02.title": "แปลงประวัติให้เป็นสัญญาณ",
  "pipeline.02.body":
    "ความใหม่ของการมาใช้บริการ แนวโน้มการใช้จ่าย แนวโน้มช่วงห่างการมาเยือน พฤติกรรมการแลกแต้ม — คำนวณทั้งหมด ณ วันที่กำหนดไว้วันเดียว พร้อมตรวจสอบอย่างชัดเจนว่าไม่มีข้อมูลหลังวันนั้นรั่วไหลเข้ามา",
  "pipeline.03.title": "จัดกลุ่มสมาชิกตามพฤติกรรม",
  "pipeline.03.body":
    "การจัดกลุ่มแบบไม่มีผู้สอน (Unsupervised Clustering) ค้นพบ 5 กลุ่มตามธรรมชาติด้วยตัวเอง ตั้งแต่แชมเปี้ยนไปจนถึงสมาชิกที่กำลังจางหายไป — ไม่มีการเลือกจำนวนกลุ่มเอง",
  "pipeline.04.title": "ให้คะแนนความเสี่ยงว่าใครจะจากไป",
  "pipeline.04.body":
    "โมเดลที่ฝึกจากข้อมูลช่วงก่อนหน้า ถูกทดสอบกับข้อมูลช่วงหลังที่ไม่เคยเห็นมาก่อน แล้วจัดอันดับสมาชิกทุกคนตามโอกาสที่จะเงียบหายไป",
  "pipeline.05.title": "แนะนำสิ่งที่ควรทำ",
  "pipeline.05.body":
    "สมาชิกที่ถูกตั้งค่าสถานะทุกคนจะได้รับเหตุผลที่เข้าใจง่ายและขั้นตอนถัดไปที่ชัดเจน — ไม่ใช่แค่ตัวเลขเปอร์เซ็นต์ความเสี่ยงในสเปรดชีต",

  // ── Results ──────────────────────────────────────────────────────────
  "results.heading": "ผลลัพธ์",
  "results.bubble.alt":
    "แผนภูมิฟองสบู่แสดง 5 กลุ่มสมาชิก จัดตำแหน่งตามความใหม่และความถี่ในการมาเยือน ขนาดฟองตามยอดใช้จ่ายเฉลี่ย",
  "results.bubble.caption":
    "สมาชิกถูกแบ่งออกเป็น 5 กลุ่มตามธรรมชาติ — แชมเปี้ยนกลุ่มเล็กที่ใช้จ่ายสูง ฐานลูกค้าประจำกลุ่มใหญ่ และอีกส่วนหนึ่งที่เงียบหายไปแล้ว",
  "results.tierRedemption.alt":
    "แผนภูมิแท่งสองภาพแสดงอัตราการเลิกใช้งานแยกตามระดับสมาชิก และแยกตามการเคยแลกแต้มหรือไม่",
  "results.tierRedemption.caption":
    "สมาชิกระดับ Gold เลิกใช้งานน้อยกว่าระดับ Bronze อย่างชัดเจน — และสมาชิกที่ไม่เคยแลกแต้มเลยสักครั้ง มีอัตราการเลิกใช้งานสูงกว่าคนที่เคยแลกอย่างเห็นได้ชัด",
  "results.confusionMatrix.alt":
    "ตารางความสับสน (Confusion Matrix) ระบุผลลัพธ์ 4 แบบ: อยู่จริง แจ้งเตือนผิดพลาด พลาดตรวจจับ และตรวจจับได้ถูกต้อง",
  "results.confusionMatrix.caption":
    "โมเดลจับสมาชิกที่กำลังจะจากไปได้เกือบทั้งหมดก่อนที่จะหายไปจริง แลกมาด้วยการแจ้งเตือนผิดพลาดจำนวนหนึ่งที่ยังจัดการได้ — ไม่มีคะแนนที่สมบูรณ์แบบ แต่เป็นคะแนนที่ตรงไปตรงมาเสมอ",
  "results.decileLift.alt":
    "แผนภูมิ Decile Lift แสดงอัตราการเลิกใช้งานจริงและรายได้ที่มีความเสี่ยง ซึ่งกระจุกตัวอยู่ในกลุ่มเสี่ยงสูงสุด",
  "results.decileLift.caption":
    "สมาชิกกลุ่มเสี่ยงสูงสุด 10% แรก คิดเป็นสัดส่วนรายได้ที่มีความเสี่ยงมากอย่างไม่สมส่วนเลยทีเดียว — นี่คือจุดที่ควรเริ่มติดต่อก่อนเป็นอันดับแรก",

  // ── What it recommends ───────────────────────────────────────────────
  "recommends.heading": "สิ่งที่ระบบแนะนำ",
  "recommends.intro":
    "กลุ่มของสมาชิกที่ถูกตั้งค่าสถานะแต่ละคนจะถูกจับคู่กับแคมเปญที่เจาะจง — ไม่ใช่แค่ “ติดต่อไป” แบบทั่วไป แต่เป็นขั้นตอนถัดไปที่เหมาะกับทั้งความเร่งด่วนและมูลค่าที่แท้จริงของสมาชิกคนนั้น",
  "recommends.colTypicalRisk": "ระดับความเสี่ยงทั่วไป",
  "action.riskLow": "ต่ำ",
  "action.riskLowMed": "ต่ำ–ปานกลาง",
  "action.riskHigh": "สูง",
  "action.riskVeryHigh": "สูงมาก",

  // ── Hero stat trio (Part B1 — borrowed from tundee.org's StatsBar) ──────
  "stats.churnRate": "อัตราการเลิกใช้งาน",

  // ── Footer (Part B1 — rebuilt to match tundee.org's 3-column footer) ────
  "footer.brandTagline": "ระบบทำนายการเลิกใช้งานและแบ่งกลุ่มสมาชิกสำหรับโปรแกรมสมาชิก",
  "footer.stackTitle": "เทคโนโลยีที่ใช้",
  "footer.linksTitle": "ลิงก์",
} as const;
