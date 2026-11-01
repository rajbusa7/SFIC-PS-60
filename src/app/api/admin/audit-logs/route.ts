import { NextResponse } from "next/server";
import { authorizeAdminOnly } from "@/lib/auth/authorization";
import { db } from "@/lib/db/database";
import type { SubjectCode } from "@shared/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeAdminOnly(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId") || undefined;
  const studentId = searchParams.get("studentId") || undefined;
  const subjectCode = (searchParams.get("subjectCode")?.toUpperCase() as SubjectCode) || undefined;

  const logs = db.getAuditLogs({ teacherId, studentId, subjectCode });
  return NextResponse.json({ success: true, count: logs.length, auditLogs: logs });
}

