import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright-core و@sparticuz/chromium يحمّلان ثنائيات Chromium في وقت
  // التشغيل ولا يجب أن يحاول المُجمِّع تضمينهما — استثناؤهما هنا يجعل
  // Vercel يتتبّعهما كملفات خارجية بدل تضمينهما في حزمة الدالة.
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
};

export default nextConfig;
