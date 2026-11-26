import { NextResponse } from "next/server";
import { getConnectUser } from "@/lib/connect/auth";
import { db } from "@/lib/db/database";

export async function GET(request: Request) {
  try {
    const user = await getConnectUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const contacts = db.getAvailableChatContacts(user.id, user.role);
    return NextResponse.json({
      success: true,
      contacts,
      role: user.role,
    });
  } catch (error: any) {
    console.error("GET /api/connect/contacts error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
