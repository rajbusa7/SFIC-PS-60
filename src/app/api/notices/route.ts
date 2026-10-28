import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/database";
import { centralAi } from "@/lib/ai/centralAiService";
import type { SupportedLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const gradeParam = searchParams.get("grade");
    const grade = gradeParam ? parseInt(gradeParam, 10) : undefined;
    const search = searchParams.get("search")?.toLowerCase();

    let notices = db.getNotices({ category, status, grade });

    if (search) {
      notices = notices.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.originalContent.toLowerCase().includes(search) ||
          n.simplifiedContent?.toLowerCase().includes(search)
      );
    }

    // Enrich with translations count and delivery metrics
    const enriched = notices.map((notice) => {
      const translations = db.getTranslations(notice.id);
      const deliveries = db.getDeliveries(notice.id);
      const totalSent = deliveries.length;
      const readCount = deliveries.filter((d) => d.status === "read" || d.status === "acknowledged").length;
      const acknowledgedCount = deliveries.filter((d) => d.status === "acknowledged").length;

      return {
        ...notice,
        translationsCount: translations.length,
        availableLanguages: [notice.originalLanguage, ...translations.map((t) => t.language)],
        deliveryStats: {
          totalSent,
          readCount,
          acknowledgedCount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    console.error("Error in GET /api/notices:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notices." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      originalContent,
      simplifiedContent,
      originalLanguage = "en",
      readingLevel = "simple",
      category = "announcement",
      targetAudience = "all",
      targetClassGrade,
      targetSection,
      urgency = "normal",
      senderTeacherName = "Head Teacher",
      senderTeacherId = "tea-001",
      autoSimplify = false,
      autoTranslate = false,
      requiresAcknowledgment = true,
      acknowledgmentDeadline,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Notice title is required." },
        { status: 400 }
      );
    }

    if (!originalContent || !originalContent.trim()) {
      return NextResponse.json(
        { success: false, error: "Original notice content is required." },
        { status: 400 }
      );
    }

    let finalSimplified = simplifiedContent?.trim();

    // AI Simplification if requested or if not provided
    if ((autoSimplify || !finalSimplified) && originalContent.trim().length > 0) {
      try {
        const simpResult = await centralAi.simplify(originalContent.trim(), {
          readingLevel: readingLevel as any,
          originalLanguage: originalLanguage as any,
        });
        finalSimplified = simpResult.simplifiedText;
      } catch (e: any) {
        console.warn("Auto-simplification fallback warning:", e.message);
        finalSimplified = originalContent.trim();
      }
    }

    const newNotice = db.saveNotice({
      title: title.trim(),
      originalContent: originalContent.trim(),
      simplifiedContent: finalSimplified,
      originalLanguage: originalLanguage as any,
      readingLevel: readingLevel as any,
      category: category as any,
      targetAudience: targetAudience as any,
      targetClassGrade: targetClassGrade ? Number(targetClassGrade) : undefined,
      targetSection: targetSection || undefined,
      urgency: urgency as any,
      senderTeacherId,
      senderTeacherName,
      status: "draft",
      requiresAcknowledgment: !!requiresAcknowledgment,
      acknowledgmentDeadline: acknowledgmentDeadline || undefined,
    });

    // Auto-translate to Gujarati & Hindi if requested
    if (autoTranslate && finalSimplified) {
      const languages: SupportedLanguage[] = ["gu", "hi"];
      for (const lang of languages) {
        if (lang !== originalLanguage) {
          try {
            const trResult = await centralAi.translate(finalSimplified, {
              targetLanguage: lang,
              sourceLanguage: originalLanguage as any,
              readingLevel: readingLevel as any,
            });

            db.saveTranslation({
              noticeId: newNotice.id,
              language: lang,
              translatedTitle: title.trim(),
              translatedContent: trResult.translatedText,
              provider: trResult.provider,
              isApprovedByTeacher: false,
            });
          } catch (trErr) {
            console.warn(`Could not auto-translate notice to ${lang}:`, trErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: newNotice,
    });
  } catch (error: any) {
    console.error("Error in POST /api/notices:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create notice." },
      { status: 500 }
    );
  }
}
