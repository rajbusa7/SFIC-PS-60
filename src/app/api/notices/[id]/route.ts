import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notice = db.getNoticeById(id);
    if (!notice) {
      return NextResponse.json(
        { success: false, error: "Notice not found." },
        { status: 404 }
      );
    }

    const translations = db.getTranslations(id);
    const deliveries = db.getDeliveries(id);

    return NextResponse.json({
      success: true,
      data: {
        ...notice,
        translations,
        deliveries,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/notices/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notice." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = db.getNoticeById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Notice not found." },
        { status: 404 }
      );
    }

    const updated = db.updateNotice(id, body);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("Error in PUT /api/notices/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notice." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = db.deleteNotice(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Notice not found or could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notice deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/notices/[id]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete notice." },
      { status: 500 }
    );
  }
}
