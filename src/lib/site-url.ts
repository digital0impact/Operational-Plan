import "server-only";
import { headers } from "next/headers";

/** يبني رابط الموقع المطلق (لاستخدامه في روابط البريد الإلكتروني حيث لا
 * توجد قيمة نسبية). يُفضَّل SITE_URL إن ضُبط، وإلا يُشتقّ من ترويسات
 * الطلب الحالي (يعمل خلف أي بروكسي عكسي يضبط X-Forwarded-*). */
export async function getBaseUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}
