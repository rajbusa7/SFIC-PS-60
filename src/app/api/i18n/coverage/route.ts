import { NextResponse } from "next/server";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import { generateTranslationCoverageReport } from "@/lib/i18n/coverage";
import { getAllGlossaryEntries } from "@/lib/i18n/glossary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = await extractSessionToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    if (session.role !== "admin" && session.role !== "teacher") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Translation coverage tools are restricted to authorized educators and administrators.",
        },
        { status: 403 }
      );
    }

    const report = generateTranslationCoverageReport();
    const glossary = getAllGlossaryEntries();

    return NextResponse.json({
      success: true,
      report,
      glossary,
    });
  } catch (error: unknown) {
    console.error("[GET /api/i18n/coverage error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute translation coverage report." },
      { status: 500 }
    );
  }
}
