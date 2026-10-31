import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { sendParentEmail } from "@/lib/gmail/gmailService";
import { generateNoticeEmailHtml } from "@/lib/gmail/emailTemplates";
import type { SupportedLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const {
      grade,
      section,
      studentIds,
      sendViaGmail = true,
      requireApprovedTranslations = true,
    } = body;

    const notice = db.getNoticeById(id);
    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found." },
        { status: 404 }
      );
    }

    // Safety check: ensure notice has at least simplified content or original content
    if (!notice.simplifiedContent && !notice.originalContent) {
      return NextResponse.json(
        { success: false, error: "Cannot send empty notice." },
        { status: 400 }
      );
    }

    const deliveries = db.sendNoticeToParents(id, {
      grade: grade ? Number(grade) : notice.targetClassGrade,
      section: section || notice.targetSection,
      studentIds,
    });

    const school = db.getSchool();
    let emailSuccessCount = 0;

    // If email dispatch is requested, dispatch each delivery via Gmail / Email Gateway
    if (sendViaGmail && deliveries.length > 0) {
      for (const delivery of deliveries) {
        try {
          const parents = db.getParentsByStudentId(delivery.studentId);
          const parent = parents[0];
          const studentName = delivery.studentName || "Student";
          const parentEmail = parent?.email || `${studentName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
          const targetLang = (delivery.language as SupportedLanguage) || "gu";

          const emailHtml = generateNoticeEmailHtml(
            notice,
            delivery.parentName,
            {
              studentName,
              language: targetLang,
              schoolName: school.name,
            }
          );

          const dispatchResult = await sendParentEmail({
            to: parentEmail,
            toName: delivery.parentName,
            subject: `[${school.name}] Notice: ${notice.title}`,
            htmlBody: emailHtml,
            fromName: `${school.name} - StudySaathi AI`,
          });

          if (dispatchResult.success) {
            emailSuccessCount++;
            delivery.channel = dispatchResult.channel as any;
            delivery.status = "delivered";

            // Persist communication record in Parent Bridge
            db.createParentCommunication({
              id: `comm-not-${Date.now()}-${delivery.studentId}`,
              studentId: delivery.studentId,
              studentName,
              studentGrade: delivery.studentGrade,
              studentSection: delivery.studentSection,
              parentId: delivery.parentId,
              parentName: delivery.parentName,
              parentEmail,
              senderId: "usr-teacher-01",
              senderName: "Class Teacher",
              senderRole: "teacher",
              type: "notice",
              title: notice.title,
              subject: `[${school.name}] Notice: ${notice.title}`,
              content: notice.simplifiedContent || notice.originalContent,
              htmlContent: emailHtml,
              channel: dispatchResult.channel,
              deliveryStatus: "delivered",
              emailMessageId: dispatchResult.messageId,
              sentAt: new Date().toISOString(),
              metadata: { noticeId: notice.id },
            });
          }
        } catch (sendErr) {
          console.error(`Failed to send notice email for student ${delivery.studentId}:`, sendErr);
        }
      }

      // Mark notice as sent via Gmail
      db.updateNotice(id, { sentViaGmail: emailSuccessCount > 0 });
    }

    return NextResponse.json({
      success: true,
      message: `Notice successfully dispatched to ${deliveries.length} parents (${emailSuccessCount} via Gmail/Email).`,
      deliveriesCount: deliveries.length,
      emailsSent: emailSuccessCount,
      data: deliveries,
    });
  } catch (error: any) {
    console.error("Error in POST /api/notices/[id]/send:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch notice." },
      { status: 500 }
    );
  }
}
