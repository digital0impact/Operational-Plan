import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canAccessPlanType } from "@/lib/subscription";
import { loadPlanShell } from "@/lib/plan-data";
import { renderGenericPlanPdf } from "@/lib/pdf/render";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getCurrentUser();
  if (!user?.school) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { planId } = await params;
  const shell = await loadPlanShell(user.school.id, planId);
  if (!shell) {
    return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
  }
  if (!canAccessPlanType(user.school, shell.planType.id)) {
    return NextResponse.redirect(new URL("/subscription?upgrade=export", request.url));
  }

  const pdf = await renderGenericPlanPdf(user.school.id, planId);
  if (!pdf) {
    return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
  }

  const asciiName = "plan.pdf";
  const arabicName = encodeURIComponent(`خطة-${user.school.name}.pdf`);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${arabicName}`,
      "Cache-Control": "no-store",
    },
  });
}
