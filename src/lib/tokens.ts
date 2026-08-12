import { randomBytes } from "node:crypto";

/** يولّد رمزًا عشوائيًا آمنًا وقصيرًا يصلح لروابط عامة (Base64 URL-safe). */
export function generatePublicToken(): string {
  return randomBytes(12).toString("base64url");
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بلا أحرف/أرقام متشابهة (O/0, I/1)

function randomCodeSegment(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return result;
}

/** يولّد رمز تفعيل مدرسة بصيغة SCH-XXXX-XXXX. */
export function generateActivationCode(): string {
  return `SCH-${randomCodeSegment(4)}-${randomCodeSegment(4)}`;
}
