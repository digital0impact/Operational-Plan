import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { renderPlanSectionPdf } from "@/lib/pdf/render";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string; sectionKey: string }> }
) {
  const user = await getCurrentUser();
  if (!user?.school) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { planId, sectionKey } = await params;
  const pdf = await renderPlanSectionPdf(user.school.id, planId, sectionKey);
  if (!pdf) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }

  const asciiName = "plan-section.pdf";
  const arabicName = encodeURIComponent(`قسم-${user.school.name}.pdf`);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${arabicName}`,
      "Cache-Control": "no-store",
    },
  });
}
