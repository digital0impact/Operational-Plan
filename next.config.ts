import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core و@sparticuz/chromium يحمّلان ثنائيات Chromium في وقت
  // التشغيل ولا يجب أن يحاول المُجمِّع تضمينهما — استثناؤهما هنا يجعل
  // Vercel يتتبّعهما كملفات خارجية بدل تضمينهما في حزمة الدالة.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  experimental: {
    // الحد الافتراضي 1MB لا يكفي لرفع صور الشواهد (خطوات 16-25) — قد
    // يُرسَل أكثر من صورة واحدة في نفس تقديم النموذج (مبادرة/برنامج لكل
    // هدف). الحد الأقصى الفعلي لكل صورة مُفرَدة مضبوط في الخادم (2MB).
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
