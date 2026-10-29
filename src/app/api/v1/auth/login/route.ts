import { NextResponse } from "next/server";
import { authService } from "@backend/services/authService";
import { validateLogin } from "@shared/schemas/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLogin(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const user = await authService.login(validation.data!.email, validation.data!.role);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 });
  }
}
