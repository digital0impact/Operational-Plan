import { randomBytes } from "node:crypto";

/** يولّد رمزًا عشوائيًا آمنًا وقصيرًا يصلح لروابط عامة (Base64 URL-safe). */
export function generatePublicToken(): string {
  return randomBytes(12).toString("base64url");
}
