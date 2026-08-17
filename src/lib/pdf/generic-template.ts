import {
  SCHOOL_CLASSIFICATION_OPTIONS,
  SCHOOL_GENDER_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  findLabel,
} from "@/lib/constants";
import { getArabicFontFaceCss } from "@/lib/pdf/fonts";
import type { PlanExportData, PlanExportSection, SectionExportData } from "@/lib/plan-data";

// ملاحظة: هذا الملف مستقل تمامًا عن src/lib/pdf/template.ts (قالب الخطة
// التشغيلية القديم) عمدًا — بأدوات مساعدة (esc/cell/numberedList) مكرَّرة
// لا مُشترَكة، حتى لا يُخاطر أي تعديل هنا بكسر تصدير الخطة التشغيلية القائم.
// نعيد استخدام نفس اللغة البصرية (لون التمييز الأخضر المزرق، خط Naskh)
// لتبقى كل مستندات PDF على المنصة متّسقة الشكل.

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

function cellMultiline(value: string | null | undefined): string {
  const safe = esc(value);
  return safe ? safe.replace(/\n/g, "<br/>") : `<span class="empty">—</span>`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

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

function renderSection(section: PlanExportSection): string {
  switch (section.kind) {
    case "STATIC_INFO":
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        <p>${cell(section.description)}</p>
      </section>`;

    case "OBJECTIVES_LIST":
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        ${numberedList(section.items, "لا توجد بنود")}
      </section>`;

    case "INDICATORS_LIST":
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        <table>
          <thead>
            <tr>
              <th style="width:5%">م</th>
              <th style="width:35%">الهدف</th>
              <th style="width:25%">مؤشر قياس الأداء</th>
              <th style="width:17.5%">القيمة المستهدفة</th>
              <th style="width:17.5%">القيمة الفعلية</th>
            </tr>
          </thead>
          <tbody>
            ${section.rows
              .map(
                (r) => `
              <tr>
                <td>${r.order + 1}</td>
                <td>${cell(r.text)}</td>
                <td>${cell(r.indicator)}</td>
                <td>${cell(r.targetValue)}</td>
                <td>${cell(r.actualValue)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </section>`;

    case "PROGRAMS_LIST":
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        <table>
          <thead>
            <tr>
              <th style="width:5%">م</th>
              <th style="width:40%">الهدف</th>
              <th>البرامج/الأنشطة</th>
            </tr>
          </thead>
          <tbody>
            ${section.objectives
              .map(
                (o) => `
              <tr>
                <td>${o.order + 1}</td>
                <td>${cell(o.text)}</td>
                <td>${o.programs.length ? cell(o.programs.join("، ")) : `<span class="empty">—</span>`}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </section>`;

    case "DETAIL_TABLE":
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        ${
          section.objectives.length === 0
            ? `<p class="empty">لا توجد بيانات بعد</p>`
            : section.objectives
                .map(
                  (o) => `
          <div class="goal-block">
            <h3>${esc(o.text)}</h3>
            ${
              o.programs.length === 0
                ? `<p class="empty">لم تُضف برامج/أنشطة لهذا الهدف</p>`
                : o.programs
                    .map(
                      (p) => `
              <h4 class="program-title">${esc(p.name)}</h4>
              <table class="kv-table">
                <tr><td>النشاط</td><td>${cell(p.activity)}</td></tr>
                <tr><td>الفئة المستهدفة</td><td>${cell(p.targetCategory)}</td></tr>
                <tr><td>متطلبات التنفيذ</td><td>${cell(p.executionRequirements)}</td></tr>
                <tr><td>تاريخ التنفيذ</td><td>${cell(p.executionDate)}</td></tr>
                <tr><td>المسؤول عن التنفيذ</td><td>${cell(p.responsible)}</td></tr>
                <tr><td>المشرف</td><td>${cell(p.supervisor)}</td></tr>
                <tr><td>الميزانية التقديرية</td><td>${cell(p.estimatedBudget)}</td></tr>
                <tr><td>الاشتراطات النظامية والأمنية</td><td>${cell(p.regulatorySecurityRequirements)}</td></tr>
                <tr><td>ملاحظة تخطيطية</td><td>${cell(p.planningNote)}</td></tr>
                <tr><td>الشاهد</td><td>${cell(p.evidence)}</td></tr>
              </table>`
                    )
                    .join("")
            }
          </div>`
                )
                .join("")
        }
      </section>`;

    case "WEEKLY_ACTIVITY_GRID": {
      const { weeks, rows } = section.grid;
      if (rows.length === 0) {
        return `
        <section class="doc-page">
          <h2 class="section-title">${esc(section.titleAr)}</h2>
          <p class="empty">لا توجد صفوف بعد</p>
        </section>`;
      }
      // 18 عمود أسبوع لا تتّسع صفحة A4 واحدة عرضًا — نقسّمها إلى مجموعات
      // صغيرة، كل مجموعة جدول HTML مستقل تحت نفس عنوان القسم، مطابقةً لتقسيم
      // النموذج الورقي الفعلي الذي بُني عليه هذا القسم (خمسة أسابيع تقريبًا
      // لكل صفحة).
      const weekChunks = chunk(weeks, 5);
      return `
      <section class="doc-page">
        <h2 class="section-title">${esc(section.titleAr)}</h2>
        ${weekChunks
          .map(
            (weekChunk) => `
        <table class="grid-table">
          <thead>
            <tr>
              <th class="grid-row-header">الصف / الفئة</th>
              ${weekChunk
                .map(
                  (w) =>
                    `<th>الأسبوع ${w.order}${w.label ? `<br/><span class="grid-week-date">${esc(w.label)}</span>` : ""}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td class="grid-row-header">${cell(r.label)}</td>
                ${weekChunk
                  .map((w) => `<td>${cellMultiline(r.cells[w.order - 1])}</td>`)
                  .join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
          )
          .join("")}
      </section>`;
    }

    default:
      return "";
  }
}

function sharedStyles(): string {
  return `
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

  .doc-page { page-break-after: always; }
  .doc-page:last-child { page-break-after: auto; }

  h1.cover-title {
    font-size: 24px; text-align: center; margin: 40px 0 6px; color: #0f6e63;
  }
  p.cover-sub { text-align: center; color: #56706e; margin: 0 0 30px; font-size: 14px; }
  .cover-box {
    border: 1px solid #cbdad7; border-radius: 10px; padding: 24px 30px;
    margin: 40px auto; max-width: 380px; text-align: center;
  }
  .cover-box .school-name { font-size: 18px; font-weight: bold; margin: 6px 0; }
  .cover-box .row { color: #56706e; font-size: 12px; margin: 4px 0; }
  .cover-footer { text-align: center; color: #8a9c9a; font-size: 10.5px; margin-top: 60px; }

  .banner {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #0f6e63;
    padding-bottom: 6px; margin-bottom: 14px;
    font-size: 10.5px; color: #56706e;
  }
  .banner b { color: #0f6e63; }

  h2.section-title {
    font-size: 15px; color: #0f6e63; border-bottom: 1px solid #cbdad7;
    padding-bottom: 5px; margin: 0 0 12px;
  }

  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td {
    border: 1px solid #cbdad7; padding: 5px 8px; text-align: right;
    vertical-align: top; font-size: 11px;
  }
  th { background: #e2eeeb; color: #0f6e63; font-weight: bold; }
  td .empty, p.empty { color: #a9b6b4; }

  .kv-table td:first-child { width: 34%; color: #56706e; background: #f4f7f6; }

  .numbered-row { display: flex; gap: 6px; margin-bottom: 4px; }
  .numbered-row .num { flex: none; color: #56706e; font-variant-numeric: tabular-nums; }

  .goal-block {
    border: 1px solid #cbdad7; border-radius: 8px; padding: 12px 14px;
    margin-bottom: 14px; page-break-inside: avoid;
  }
  .goal-block h3 { font-size: 13px; margin: 0 0 8px; color: #0f6e63; }
  .program-title { font-size: 12px; margin: 10px 0 4px; color: #14231f; }

  .grid-table {
    table-layout: fixed; margin-bottom: 16px; page-break-inside: avoid;
  }
  .grid-table th, .grid-table td { font-size: 9.5px; padding: 4px 6px; line-height: 1.5; }
  .grid-table .grid-row-header { width: 15%; background: #f4f7f6; color: #14231f; font-weight: bold; }
  .grid-table thead .grid-row-header { background: #e2eeeb; color: #0f6e63; }
  .grid-table .grid-week-date { font-weight: normal; color: #56706e; font-size: 8.5px; }
  `;
}

function coverSection(
  planTypeName: string,
  academicYear: string,
  schoolName: string,
  schoolUnit: string,
  schoolGender: string,
  schoolSystem: string,
  generatedAt: Date
): string {
  return `
  <section class="doc-page">
    <h1 class="cover-title">${esc(planTypeName)}</h1>
    <p class="cover-sub">العام الدراسي ${esc(academicYear)}</p>

    <div class="cover-box">
      <div class="row">مدرسة</div>
      <div class="school-name">${cell(schoolName)}</div>
      <div class="row">${cell(findLabel(SCHOOL_STAGE_OPTIONS, schoolUnit))} ·
        ${cell(findLabel(SCHOOL_GENDER_OPTIONS, schoolGender))} ·
        ${cell(findLabel(SCHOOL_CLASSIFICATION_OPTIONS, schoolSystem))}</div>
    </div>

    <p class="cover-footer">
      أُنشئت هذه الوثيقة آليًا عبر منصة تخطيط بتاريخ
      ${new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(generatedAt)}
    </p>
  </section>`;
}

export function buildGenericPlanHtml(data: PlanExportData): string {
  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>${sharedStyles()}</style>
</head>
<body>

  ${coverSection(
    data.planTypeName,
    data.academicYear,
    data.schoolName,
    data.schoolUnit,
    data.schoolGender,
    data.schoolSystem,
    data.generatedAt
  )}

  ${data.sections.map(renderSection).join("")}

</body>
</html>
`;
}

/**
 * يبني صفحة PDF لقسم واحد فقط بمعزل عن باقي الخطة — مثلًا تنزيل الجدول
 * الأسبوعي وحده دون بقية أقسام خطة النشاط الطلابي. يعيد استخدام نفس
 * renderSection ونفس الأنماط البصرية، بترويسة شريط واحدة (لا صفحة غلاف
 * كاملة). الشريط والتاريخ يسبقان .doc-page الذي يبنيه renderSection كإخوة
 * لا كأبناء — حتى يبقى .doc-page آخر عنصر فعليًا في body، فيعمل انتقاء
 * `:last-child` في sharedStyles (بلا فاصل صفحة زائد بعده) كما هو مصمَّم.
 */
export function buildSectionOnlyHtml(data: SectionExportData): string {
  return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>${sharedStyles()}</style>
</head>
<body>

  <div class="banner">
    <span>${esc(data.schoolName)} · العام الدراسي ${esc(data.academicYear)} ·
      أُنشئت آليًا عبر منصة تخطيط بتاريخ
      ${new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(data.generatedAt)}</span>
    <b>${esc(data.planTypeName)}</b>
  </div>
  ${renderSection(data.section)}

</body>
</html>
`;
}
