import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  getClearCookieOptions,
} from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set(SESSION_COOKIE_NAME, "", getClearCookieOptions());
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", getClearCookieOptions());
  return response;
}
