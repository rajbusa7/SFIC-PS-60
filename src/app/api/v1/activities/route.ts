import { NextResponse } from "next/server";
import { activityRepository } from "@backend/repositories/activityRepository";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId") || undefined;
    const activities = await activityRepository.findAll(conceptId);
    return NextResponse.json({ success: true, count: activities.length, activities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
