import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** نموذج Claude المستخدم في كل استدعاءات الاقتراح بالذكاء الاصطناعي. */
export const AI_MODEL = "claude-opus-5";

let cachedClient: Anthropic | null = null;

/** هل مفتاح واجهة الذكاء الاصطناعي مضبوط في بيئة هذا الخادم؟ */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** يُعيد عميل Anthropic جاهزًا، أو null إن لم يُضبط ANTHROPIC_API_KEY. */
export function getAiClient(): Anthropic | null {
  if (!isAiConfigured()) return null;
  if (!cachedClient) {
    cachedClient = new Anthropic();
  }
  return cachedClient;
}
