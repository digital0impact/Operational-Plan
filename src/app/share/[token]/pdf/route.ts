import { NextResponse } from "next/server";
import { getSchoolByShareToken } from "@/lib/public-data";
import { renderSchoolPlanPdf } from "@/lib/pdf/render";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const school = await getSchoolByShareToken(token);
  if (!school) {
    return new NextResponse("رابط غير صالح", { status: 404 });
  }

  const pdf = await renderSchoolPlanPdf(school.id);
  const arabicName = encodeURIComponent(`الخطة-التشغيلية-${school.name}.pdf`);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="operational-plan.pdf"; filename*=UTF-8''${arabicName}`,
      "Cache-Control": "no-store",
    },
  });
}
