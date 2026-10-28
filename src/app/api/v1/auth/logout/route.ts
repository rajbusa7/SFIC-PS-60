import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getClearCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set(SESSION_COOKIE_NAME, "", getClearCookieOptions());
  return response;
}
