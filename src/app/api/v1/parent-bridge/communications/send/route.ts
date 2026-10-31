import { NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { sendParentEmail } from "@/lib/gmail/gmailService";
import {
  generateNoticeEmailHtml,
  generateAttendanceEmailHtml,
  generateAcademicReportEmailHtml,
  generateLearningGapEmailHtml,
  generateRemedialPlanEmailHtml,
  generateGeneralUpdateEmailHtml,
} from "@/lib/gmail/emailTemplates";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import type { CommunicationType, SupportedLanguage, StudentAttendanceSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionToken = await extractSessionToken(request);
    let sessionUser: any = null;
    if (sessionToken) {
      sessionUser = await verifySession(sessionToken);
      if (sessionUser && sessionUser.role !== "teacher" && sessionUser.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Access denied. Only teachers and administrators can dispatch communications." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      studentId,
      parentId: explicitParentId,
      type = "general",
      subject,
      title,
      language: reqLanguage,
      customMessage,
      academicDetails,
      gapDetails,
      planDetails,
      attendanceDetails,
      noticeDetails,
    } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid studentId is required." },
        { status: 400 }
      );
    }

    const student = await db.getStudentByIdAsync(studentId);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student record not found." },
        { status: 404 }
      );
    }

    const school = db.getSchool();
    const parents = db.getParentsByStudentId(studentId);
    const parent = parents[0] || {
      id: explicitParentId || `par-${student.id}`,
      name: `Parent of ${student.displayName}`,
      email: `${student.displayName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      preferredLanguage: "gu" as SupportedLanguage,
      studentIds: [studentId],
    };

    const parentEmail = parent.email || `${student.displayName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
    const parentName = parent.name || `Parent of ${student.displayName}`;
    const targetLanguage: SupportedLanguage = reqLanguage || parent.preferredLanguage || "gu";

    // Normalize communication type to valid CommunicationType
    let commType: CommunicationType = "general";
    if (type === "attendance") commType = "attendance";
    else if (type === "academic" || type === "academic_report") commType = "academic";
    else if (type === "learning_gap") commType = "learning_gap";
    else if (type === "remedial_plan") commType = "remedial_plan";
    else if (type === "notice" || type === "announcement") commType = "notice";
    else if (type === "homework") commType = "homework";

    let htmlContent = "";
    const effectiveTitle = title || `Update regarding ${student.displayName}`;
    const effectiveSubject = subject || `[${school.name}] ${effectiveTitle}`;

    const templateOptions = {
      schoolName: school.name,
      studentName: student.displayName,
      language: targetLanguage,
    };

    switch (commType) {
      case "attendance": {
        const fallbackAttendance: StudentAttendanceSummary = {
          studentId,
          attendanceRate: 92.5,
          totalDays: 110,
          presentDays: 102,
          absentDays: 8,
          lastUpdated: new Date().toISOString(),
          recentAbsences: [],
          teacherRemarks: customMessage,
        };
        const attData = attendanceDetails || db.getStudentAttendance(studentId) || fallbackAttendance;
        if (customMessage) {
          attData.teacherRemarks = customMessage;
        }

        htmlContent = generateAttendanceEmailHtml(
          student.displayName,
          parentName,
          attData,
          templateOptions
        );
        break;
      }

      case "academic": {
        const results = db.getResults(studentId);
        const avgScore = results.length > 0
          ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
          : 75;

        const acadData = academicDetails || {
          averagePercentage: avgScore,
          trend: (avgScore >= 75 ? "improving" : avgScore >= 50 ? "steady" : "needs_support") as "improving" | "steady" | "needs_support",
          recentAssessments: results.slice(0, 4).map((r) => ({
            title: r.assessmentId?.includes("math") ? "Mathematics Unit Assessment" : "Gujarati Vocabulary Check",
            subject: r.assessmentId?.includes("math") ? "Mathematics" : "Gujarati",
            score: r.marksObtained ?? 15,
            maxScore: r.maximumMarks ?? 25,
            percentage: r.percentage ?? 60,
          })),
          teacherFeedback: customMessage,
        };

        htmlContent = generateAcademicReportEmailHtml(
          student.displayName,
          parentName,
          acadData,
          templateOptions
        );
        break;
      }

      case "learning_gap": {
        const gaps = db.getLearningGaps(studentId);
        const topGap = gaps[0];
        const gapData = gapDetails || {
          conceptName: topGap?.conceptName || "Multiplication and Division Fundamentals",
          subject: topGap?.subjectCode === "MATH" ? "Mathematics" : "Language",
          priority: topGap?.priority || "High",
          status: topGap?.status || "Needs Support",
          latestPercentage: topGap?.latestPercentage || 45,
          operationalMasteryThreshold: 60,
          diagnosis: topGap?.reason || "Student exhibits conceptual confusion in step-by-step calculation.",
          suggestedHomeSupport: customMessage || "Practice 10 minutes of practical counting and distribution exercises at home.",
        };

        htmlContent = generateLearningGapEmailHtml(
          student.displayName,
          parentName,
          gapData,
          templateOptions
        );
        break;
      }

      case "remedial_plan": {
        const plans = db.getRemedialPlans(studentId);
        const topPlan = plans[0];
        const planData = planDetails || {
          conceptName: topPlan?.conceptName || "Division with Remainders",
          learningObjective: topPlan?.learningObjective || "Understand division as equal sharing and grouping.",
          steps: topPlan?.steps && topPlan.steps.length > 0
            ? topPlan.steps.map((st: any, idx: number) => ({
                stepNumber: st.stepNumber || idx + 1,
                title: st.title || `Remedial Step ${idx + 1}`,
                description: st.description || "Review core concept with practical examples",
                durationMinutes: st.durationMinutes || 15,
              }))
            : [
                {
                  stepNumber: 1,
                  title: "Concrete Physical Grouping",
                  description: "Use 12 items to demonstrate equal distribution into bowls.",
                  durationMinutes: 10,
                },
                {
                  stepNumber: 2,
                  title: "Visual Number Line Verification",
                  description: "Draw repeated subtraction hops on paper.",
                  durationMinutes: 15,
                },
              ],
          practiceInstructions: customMessage || topPlan?.teacherInstructions,
        };

        htmlContent = generateRemedialPlanEmailHtml(
          student.displayName,
          parentName,
          planData,
          templateOptions
        );
        break;
      }

      case "notice": {
        const nDetails = noticeDetails || {
          id: `notice-gen-${Date.now()}`,
          title: effectiveTitle,
          originalContent: customMessage || effectiveTitle,
          simplifiedContent: customMessage || effectiveTitle,
          actionRequired: false,
          category: "academic",
        };
        htmlContent = generateNoticeEmailHtml(
          nDetails,
          parentName,
          templateOptions
        );
        break;
      }

      case "general":
      default: {
        htmlContent = generateGeneralUpdateEmailHtml(
          student.displayName,
          parentName,
          {
            title: effectiveTitle,
            subject: effectiveSubject,
            content: customMessage || "Important academic update from your child's teacher.",
            teacherName: sessionUser?.name || "Class Teacher",
          },
          templateOptions
        );
        break;
      }
    }

    // Dispatch email via Gmail API (or fallback system)
    const dispatchResult = await sendParentEmail({
      to: parentEmail,
      toName: parentName,
      subject: effectiveSubject,
      htmlBody: htmlContent,
      fromName: `${school.name} - StudySaathi AI`,
    });

    // Save record to persistent database
    const communication = db.createParentCommunication({
      studentId,
      studentName: student.displayName,
      studentGrade: student.grade,
      studentSection: student.section,
      parentId: parent.id,
      parentName,
      parentEmail,
      senderId: sessionUser?.id || "usr-teacher-01",
      senderName: sessionUser?.name || "Class Teacher",
      senderRole: (sessionUser?.role === "admin" ? "admin" : "teacher"),
      type: commType,
      title: effectiveTitle,
      subject: effectiveSubject,
      content: customMessage || effectiveTitle,
      htmlContent,
      channel: dispatchResult.channel,
      deliveryStatus: dispatchResult.success ? "delivered" : "failed",
      emailMessageId: dispatchResult.messageId,
      metadata: {
        academicDetails,
        gapDetails,
        planDetails,
        attendanceDetails,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Communication dispatched via ${dispatchResult.channel.toUpperCase()} to ${parentEmail}.`,
      communication,
      dispatchResult,
    });
  } catch (error: any) {
    console.error("[Send Communication API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch communication" },
      { status: 500 }
    );
  }
}
