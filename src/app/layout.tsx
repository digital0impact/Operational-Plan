import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "التخطيط الذكي",
  description: "التخطيط الذكي لإعداد خطط مدارس التعليم العام",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
