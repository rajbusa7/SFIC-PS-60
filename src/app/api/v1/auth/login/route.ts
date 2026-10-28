import { NextResponse } from "next/server";
import { authService } from "@backend/services/authService";
import { validateLogin } from "@shared/schemas/validation";
import {
  SESSION_COOKIE_NAME,
  signSession,
  getSessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLogin(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const user = await authService.login(validation.data!.email, validation.data!.role);

    // Sign session token and set HTTP-only cookie
    const token = await signSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      provider: "local",
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 });
  }
}
