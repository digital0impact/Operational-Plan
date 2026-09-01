import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canAccessPlanType, getPlanTypeIdByKey } from "@/lib/subscription";
import { renderSchoolPlanPdf } from "@/lib/pdf/render";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.school) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const operationalPlanTypeId = await getPlanTypeIdByKey("operational");
  if (!operationalPlanTypeId || !canAccessPlanType(user.school, operationalPlanTypeId)) {
    return NextResponse.redirect(new URL("/subscription?upgrade=export", request.url));
  }

  const pdf = await renderSchoolPlanPdf(user.school.id);

  const asciiName = "operational-plan.pdf";
  const arabicName = encodeURIComponent(
    `الخطة-التشغيلية-${user.school.name}.pdf`
  );

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${arabicName}`,
      "Cache-Control": "no-store",
    },
  });
}
