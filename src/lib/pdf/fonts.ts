import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

let cachedFontFaceCss: string | null = null;

/**
 * يُضمِّن خط Noto Naskh Arabic (متغيّر الوزن) كـ base64 مباشرة داخل الصفحة،
 * حتى لا يعتمد إخراج PDF على وجود خطوط عربية على نظام التشغيل الذي يُشغّل
 * متصفح Chromium الخالي من الواجهة (headless).
 */
export function getArabicFontFaceCss(): string {
  if (cachedFontFaceCss) return cachedFontFaceCss;

  const fontPath = path.join(
    process.cwd(),
    "src/assets/fonts/NotoNaskhArabic-Variable.ttf"
  );
  const base64 = readFileSync(fontPath).toString("base64");

  cachedFontFaceCss = `
    @font-face {
      font-family: "Naskh";
      src: url(data:font/ttf;base64,${base64}) format("truetype-variations");
      font-weight: 100 900;
      font-display: swap;
    }
  `;
  return cachedFontFaceCss;
}
