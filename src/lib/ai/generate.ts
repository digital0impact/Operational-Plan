import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { AI_MODEL, getAiClient } from "@/lib/ai/client";

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: "PAYWALL" };

const NOT_CONFIGURED_ERROR =
  "ميزة الاقتراح بالذكاء الاصطناعي غير مفعّلة على هذا الخادم (لم يُضبط متغيّر البيئة ANTHROPIC_API_KEY).";

/**
 * يستدعي Claude لتوليد استجابة JSON مطابقة لمخطط Zod معطى (structured
 * outputs عبر output_config.format)، ويُعيد نتيجة موحّدة {ok, data|error}
 * بدل رمي استثناء، حتى تعرض واجهة المستخدم رسالة عربية واضحة في كل حالة
 * فشل (مفتاح غير مضبوط، تعذّر الاتصال، تعذّر التحقق من الصيغة...).
 */
export async function generateStructured<Schema extends z.ZodType>(
  system: string,
  userPrompt: string,
  schema: Schema
): Promise<AiResult<z.infer<Schema>>> {
  const client = getAiClient();
  if (!client) {
    return { ok: false, error: NOT_CONFIGURED_ERROR };
  }

  try {
    const response = await client.messages.parse({
      model: AI_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: userPrompt }],
      output_config: { format: zodOutputFormat(schema) },
    });

    if (!response.parsed_output) {
      return {
        ok: false,
        error: "تعذّر توليد اقتراح صالح من الذكاء الاصطناعي، حاول مرة أخرى.",
      };
    }

    return { ok: true, data: response.parsed_output };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "مفتاح واجهة الذكاء الاصطناعي غير صالح." };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return {
        ok: false,
        error: "خدمة الذكاء الاصطناعي مشغولة حاليًا، حاول بعد قليل.",
      };
    }
    if (error instanceof Anthropic.APIError) {
      return {
        ok: false,
        error: `تعذّر الاتصال بخدمة الذكاء الاصطناعي (خطأ ${error.status}).`,
      };
    }
    return {
      ok: false,
      error: "حدث خطأ غير متوقع أثناء توليد الاقتراح.",
    };
  }
}
