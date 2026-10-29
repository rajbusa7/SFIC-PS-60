import { NextResponse } from "next/server";
import { authService } from "@backend/services/authService";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || undefined;
    const user = await authService.getCurrentUser(authHeader);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
