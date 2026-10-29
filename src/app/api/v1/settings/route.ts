import { NextResponse } from "next/server";
import { settingsRepository } from "@backend/repositories/settingsRepository";

export async function GET() {
  try {
    const school = await settingsRepository.getSchool();
    const settings = await settingsRepository.getSettings();
    return NextResponse.json({ success: true, school, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await settingsRepository.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
