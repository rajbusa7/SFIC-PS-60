import { NextResponse } from "next/server";
import { remedialService } from "@backend/services/remedialService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const plans = await remedialService.getRemedialPlans(id);
    return NextResponse.json({ success: true, count: plans.length, remedialPlans: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
