import {
  BUILDING_INDEPENDENCE_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  PERFORMANCE_LEVEL_OPTIONS,
  PROCEDURE_INPUTS,
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  STUDY_TIME_OPTIONS,
  findLabel,
} from "@/lib/constants";
import { getArabicFontFaceCss } from "@/lib/pdf/fonts";

export type PlanSchool = {
  name: string;
  unit: string;
  schoolSystem: string;
  gender: string;
  ministryNumber: string | null;
  studyTime: string | null;
  studentsCount: number | null;
  classroomsCount: number | null;
  buildingType: string | null;
  educationType: string | null;
  buildingIndependence: string | null;
  phone: string | null;
  schoolEmail: string | null;
  address: string | null;
  performanceGeneral: string | null;
  performanceManagement: string | null;
  performanceTeachingLearning: string | null;
  performanceLearningOutcomes: string | null;
  performanceEnvironment: string | null;
};

export type PlanActionItem = {
  activity: string;
  targetCategory: string;
  executionRequirements: string;
  executionDate: string;
  responsible: string;
  evidence: string;
  evidenceImageUrl: string | null;
};

export type PlanInitiative = {
  type: "INITIATIVE" | "PROGRAM";
  name: string;
  actionItem: PlanActionItem | null;
};

export type PlanOperationalGoal = {
  order: number;
  strategicTitle: string;
  text: string;
  indicator: string;
  targetValue: string;
  initiatives: PlanInitiative[];
};

export type PlanData = {
  school: PlanSchool;
  managerName: string;
  procedureInputs: { type: string; acknowledged: boolean }[];
  strategicGoals: { order: number; title: string }[];
  operationalGoals: PlanOperationalGoal[];
  swot: {
    STRENGTH: string[];
    WEAKNESS: string[];
    OPPORTUNITY: string[];
    THREAT: string[];
  };
  keyIssues: string[];
  generatedAt: Date;
};

function esc(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string | null | undefined): string {
  const safe = esc(value);
  return safe ? safe : `<span class="empty">—</span>`;
}

// نتفادى ترقيم <ol> الأصلي عمدًا: محرّكات العرض تعكس موضع النقطة مقابل
// الرقم في السياق RTL بمجرد أن يصبح الرقم من خانتين (مثلًا العنصر 10)،
// فنبني الترقيم يدويًا لضمان ثبات الشكل مهما كان عدد العناصر.
function numberedList(items: string[], emptyLabel: string): string {
  if (items.length === 0) {
    return `<p class="empty">${emptyLabel}</p>`;
  }
  return `<div class="numbered">${items
    .map(
      (item, i) =>
        `<div class="numbered-row"><span class="num">${i + 1}.</span><span>${cell(item)}</span></div>`
    )
    .join("")}</div>`;
}

function swotColumn(title: string, items: string[]): string {
  return `
    <div class="swot-col">
      <h4>${title}</h4>
      ${numberedList(items, "لا توجد بنود")}
    </div>
  `;
}

function initiativeTypeLabel(type: "INITIATIVE" | "PROGRAM"): string {
  return type === "INITIATIVE" ? "مبادرة" : "برنامج";
}

export function buildPlanHtml(data: PlanData): string {
  const { school } = data;

  const inputStatus = Object.fromEntries(
    data.procedureInputs.map((i) => [i.type, i.acknowledged])
  );

  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  ${getArabicFontFaceCss()}

  * { box-sizing: border-box; }
  @page { size: A4; }
  html, body {
    margin: 0; padding: 0;
    direction: rtl;
    font-family: "Naskh", "Segoe UI", Tahoma, sans-serif;
    color: #14231f;
    font-size: 12.5px;
    line-height: 1.7;
  }

  .doc-page {
    page-break-after: always;
  }
  .doc-page:last-child { page-break-after: auto; }

  .banner {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #0f6e63;
    padding-bottom: 6px; margin-bottom: 14px;
    font-size: 10.5px; color: #56706e;
  }
  .banner b { color: #0f6e63; }

  h1.cover-title {
    font-size: 26px; text-align: center; margin: 40px 0 6px; color: #0f6e63;
  }
  p.cover-sub { text-align: center; color: #56706e; margin: 0 0 30px; font-size: 14px; }
  .cover-code {
    text-align: center; font-family: monospace; font-size: 13px;
    background: #e2eeeb; color: #0f6e63; display: inline-block;
    padding: 4px 14px; border-radius: 6px; margin: 0 auto 30px; display: block;
    width: fit-content;
  }
  .cover-box {
    border: 1px solid #cbdad7; border-radius: 10px; padding: 24px 30px;
    margin: 40px auto; max-width: 380px; text-align: center;
  }
  .cover-box .school-name { font-size: 18px; font-weight: bold; margin: 6px 0; }
  .cover-box .row { color: #56706e; font-size: 12px; margin: 4px 0; }
  .cover-footer { text-align: center; color: #8a9c9a; font-size: 10.5px; margin-top: 60px; }

  h2.section-title {
    font-size: 15px; color: #0f6e63; border-bottom: 1px solid #cbdad7;
    padding-bottom: 5px; margin: 0 0 12px;
  }
  h3.subsection-title { font-size: 12.5px; margin: 16px 0 6px; color: #14231f; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td {
    border: 1px solid #cbdad7; padding: 5px 8px; text-align: right;
    vertical-align: top; font-size: 11px;
  }
  th { background: #e2eeeb; color: #0f6e63; font-weight: bold; }
  td .empty, p.empty { color: #a9b6b4; }

  .kv-table td:first-child { width: 34%; color: #56706e; background: #f4f7f6; }

  .evidence-img {
    display: block; margin-top: 4px; max-width: 60px; max-height: 60px;
    border: 1px solid #d7e3e1; border-radius: 4px; object-fit: cover;
  }

  .numbered-row {
    display: flex; gap: 6px; margin-bottom: 4px;
  }
  .numbered-row .num {
    flex: none; color: #56706e; font-variant-numeric: tabular-nums;
  }

  .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 8px; }
  .swot-col { border: 1px solid #cbdad7; border-radius: 6px; padding: 10px; }
  .swot-col h4 { margin: 0 0 6px; font-size: 12px; color: #0f6e63; }

  .goal-block {
    border: 1px solid #cbdad7; border-radius: 8px; padding: 12px 14px;
    margin-bottom: 14px; page-break-inside: avoid;
  }
  .goal-block h3 {
    font-size: 13px; margin: 0 0 8px; color: #0f6e63;
  }
  .goal-meta { display: flex; gap: 18px; flex-wrap: wrap; font-size: 11px; color: #56706e; margin-bottom: 8px; }
  .goal-meta b { color: #14231f; }
  .tag {
    display: inline-block; font-size: 10px; padding: 1px 7px; border-radius: 999px;
    background: #e2eeeb; color: #0f6e63; margin-left: 4px;
  }
</style>
</head>
<body>

  <!-- الغلاف -->
  <section class="doc-page">
    <div class="cover-code">إجراء رقم س-1-أ-1</div>
    <h1 class="cover-title">إعداد الخطة التشغيلية للعام الدراسي 1447-1448هـ</h1>
    <p class="cover-sub">دليل إجراءات عمل مدارس التعليم العام 2025م</p>

    <div class="cover-box">
      <div class="row">مدرسة</div>
      <div class="school-name">${cell(school.name)}</div>
      <div class="row">${cell(findLabel(SCHOOL_STAGE_OPTIONS, school.unit))} ·
        ${cell(findLabel(SCHOOL_GENDER_OPTIONS, school.gender))} ·
        ${cell(findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem))}</div>
      <div class="row" style="margin-top:14px">مدير المدرسة: ${cell(data.managerName)}</div>
    </div>

    <p class="cover-footer">
      أُنشئت هذه الوثيقة آليًا عبر التخطيط الذكي بتاريخ
      ${new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(data.generatedAt)}
    </p>
  </section>

  <!-- بيانات المدرسة ومستوى الأداء ومدخلات الإجراء -->
  <section class="doc-page">
    <div class="banner"><span>إعداد الخطة التشغيلية للعام الدراسي 1447هـ</span><b>بيانات المدرسة</b></div>

    <h2 class="section-title">بيانات المدرسة</h2>
    <table class="kv-table">
      <tr><td>اسم المدرسة</td><td>${cell(school.name)}</td></tr>
      <tr><td>الوحدة (المرحلة)</td><td>${cell(findLabel(SCHOOL_STAGE_OPTIONS, school.unit))}</td></tr>
      <tr><td>تصنيف المدرسة</td><td>${cell(findLabel(SCHOOL_CLASSIFICATION_OPTIONS, school.schoolSystem))}</td></tr>
      <tr><td>الرقم الوزاري</td><td>${cell(school.ministryNumber)}</td></tr>
      <tr><td>وقت الدراسة</td><td>${cell(findLabel(STUDY_TIME_OPTIONS, school.studyTime))}</td></tr>
      <tr><td>عدد الطلاب</td><td>${cell(school.studentsCount?.toString())}</td></tr>
      <tr><td>عدد الفصول</td><td>${cell(school.classroomsCount?.toString())}</td></tr>
      <tr><td>جنس المدرسة</td><td>${cell(findLabel(SCHOOL_GENDER_OPTIONS, school.gender))}</td></tr>
      <tr><td>نوع المبنى</td><td>${cell(findLabel(BUILDING_TYPE_OPTIONS, school.buildingType))}</td></tr>
      <tr><td>نوع التعليم</td><td>${cell(school.educationType)}</td></tr>
      <tr><td>استقلالية المبنى</td><td>${cell(findLabel(BUILDING_INDEPENDENCE_OPTIONS, school.buildingIndependence))}</td></tr>
      <tr><td>هاتف المدرسة</td><td>${cell(school.phone)}</td></tr>
      <tr><td>بريد المدرسة</td><td>${cell(school.schoolEmail)}</td></tr>
      <tr><td>العنوان</td><td>${cell(school.address)}</td></tr>
    </table>

    <h2 class="section-title">مستوى الأداء</h2>
    <table class="kv-table">
      <tr><td>مستوى الأداء العام</td><td>${cell(findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceGeneral))}</td></tr>
      <tr><td>مستوى الإدارة المدرسية</td><td>${cell(findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceManagement))}</td></tr>
      <tr><td>مستوى التعليم والتعلم</td><td>${cell(findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceTeachingLearning))}</td></tr>
      <tr><td>مستوى نواتج التعلم</td><td>${cell(findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceLearningOutcomes))}</td></tr>
      <tr><td>مستوى البيئة المدرسية</td><td>${cell(findLabel(PERFORMANCE_LEVEL_OPTIONS, school.performanceEnvironment))}</td></tr>
    </table>

    <h2 class="section-title">قائمة مدخلات الإجراء</h2>
    <table>
      <thead><tr><th style="width:5%">م</th><th>اسم المدخلات</th><th style="width:14%">الحالة</th></tr></thead>
      <tbody>
        ${PROCEDURE_INPUTS.map(
          (input, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${cell(input.label)}</td>
            <td>${inputStatus[input.type] ? "✓ تم الاطلاع" : "—"}</td>
          </tr>`
        ).join("")}
      </tbody>
    </table>
  </section>

  <!-- الأهداف الاستراتيجية والمصفوفة -->
  <section class="doc-page">
    <div class="banner"><span>إعداد الخطة التشغيلية للعام الدراسي 1447هـ</span><b>الأهداف الاستراتيجية</b></div>

    <h2 class="section-title">الأهداف الاستراتيجية لوزارة التعليم</h2>
    ${numberedList(data.strategicGoals.map((g) => g.title), "—")}

    <h2 class="section-title" style="margin-top:20px">مصفوفة ربط الأهداف الاستراتيجية بالأهداف التشغيلية للمدرسة</h2>
    <table>
      <thead><tr><th style="width:5%">م</th><th style="width:38%">الهدف الاستراتيجي</th><th>الهدف التشغيلي للمدرسة</th></tr></thead>
      <tbody>
        ${data.operationalGoals
          .map(
            (g) => `
          <tr>
            <td>${g.order}</td>
            <td>${cell(g.strategicTitle)}</td>
            <td>${cell(g.text)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </section>

  <!-- مؤشرات الأداء وتحليل SWOT -->
  <section class="doc-page">
    <div class="banner"><span>إعداد الخطة التشغيلية للعام الدراسي 1447هـ</span><b>مؤشرات الأداء وتحليل الواقع</b></div>

    <h2 class="section-title">مؤشرات قياس الأداء التشغيلية</h2>
    <table>
      <thead><tr><th style="width:5%">م</th><th style="width:30%">الهدف التشغيلي</th><th style="width:35%">مؤشر قياس الأداء</th><th>القيمة المستهدفة</th></tr></thead>
      <tbody>
        ${data.operationalGoals
          .map(
            (g) => `
          <tr>
            <td>${g.order}</td>
            <td>${cell(g.text)}</td>
            <td>${cell(g.indicator)}</td>
            <td>${cell(g.targetValue)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <h2 class="section-title" style="margin-top:18px">تحليل البيئة الداخلية للمدرسة</h2>
    <div class="swot-grid">
      ${swotColumn("نقاط القوة", data.swot.STRENGTH)}
      ${swotColumn("نقاط الضعف", data.swot.WEAKNESS)}
    </div>

    <h2 class="section-title" style="margin-top:18px">تحليل البيئة الخارجية للمدرسة</h2>
    <div class="swot-grid">
      ${swotColumn("الفرص", data.swot.OPPORTUNITY)}
      ${swotColumn("التهديدات", data.swot.THREAT)}
    </div>
  </section>

  <!-- القضايا الرئيسية والمبادرات والبرامج -->
  <section class="doc-page">
    <div class="banner"><span>إعداد الخطة التشغيلية للعام الدراسي 1447هـ</span><b>القضايا والمبادرات</b></div>

    <h2 class="section-title">القضايا الرئيسية</h2>
    ${numberedList(data.keyIssues, "لم تُحدَّد قضايا رئيسية")}

    <h2 class="section-title" style="margin-top:18px">المبادرات والبرامج التشغيلية</h2>
    <table>
      <thead><tr><th style="width:5%">م</th><th style="width:28%">الهدف التشغيلي</th><th style="width:33%">المبادرات</th><th>البرامج</th></tr></thead>
      <tbody>
        ${data.operationalGoals
          .map((g) => {
            const initiatives = g.initiatives
              .filter((i) => i.type === "INITIATIVE")
              .map((i) => i.name);
            const programs = g.initiatives
              .filter((i) => i.type === "PROGRAM")
              .map((i) => i.name);
            return `
          <tr>
            <td>${g.order}</td>
            <td>${cell(g.text)}</td>
            <td>${initiatives.length ? cell(initiatives.join("، ")) : `<span class="empty">—</span>`}</td>
            <td>${programs.length ? cell(programs.join("، ")) : `<span class="empty">—</span>`}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </section>

  <!-- الخطة التشغيلية التفصيلية -->
  <section class="doc-page">
    <div class="banner"><span>إعداد الخطة التشغيلية للعام الدراسي 1447هـ</span><b>الخطة التشغيلية للمدرسة</b></div>
    <h2 class="section-title">الخطة التشغيلية التفصيلية لكل هدف استراتيجي</h2>

    ${data.operationalGoals
      .map(
        (g) => `
      <div class="goal-block">
        <h3>الهدف الاستراتيجي (${g.order}) ${esc(g.strategicTitle)}</h3>
        <div class="goal-meta">
          <span><b>الهدف التشغيلي:</b> ${cell(g.text)}</span>
        </div>
        <div class="goal-meta">
          <span><b>مؤشر قياس الأداء:</b> ${cell(g.indicator)}</span>
          <span><b>القيمة المستهدفة:</b> ${cell(g.targetValue)}</span>
        </div>

        ${
          g.initiatives.length === 0
            ? `<p class="empty">لم تُضف مبادرات أو برامج لهذا الهدف</p>`
            : `
        <table>
          <thead>
            <tr>
              <th style="width:14%">المبادرة/البرنامج</th>
              <th>الأنشطة</th>
              <th style="width:12%">الفئة المستهدفة</th>
              <th style="width:14%">متطلبات التنفيذ</th>
              <th style="width:10%">تاريخ التنفيذ</th>
              <th style="width:14%">التنفيذ والمسؤولية</th>
              <th style="width:12%">الشواهد</th>
            </tr>
          </thead>
          <tbody>
            ${g.initiatives
              .map(
                (i) => `
              <tr>
                <td><span class="tag">${initiativeTypeLabel(i.type)}</span>${cell(i.name)}</td>
                <td>${cell(i.actionItem?.activity)}</td>
                <td>${cell(i.actionItem?.targetCategory)}</td>
                <td>${cell(i.actionItem?.executionRequirements)}</td>
                <td>${cell(i.actionItem?.executionDate)}</td>
                <td>${cell(i.actionItem?.responsible)}</td>
                <td>
                  ${cell(i.actionItem?.evidence)}
                  ${
                    i.actionItem?.evidenceImageUrl
                      ? `<img class="evidence-img" src="${i.actionItem.evidenceImageUrl}" alt="صورة الشاهد" />`
                      : ""
                  }
                </td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
        }
      </div>`
      )
      .join("")}
  </section>

</body>
</html>
`;
}
