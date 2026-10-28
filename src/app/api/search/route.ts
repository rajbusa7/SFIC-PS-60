import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/database";

export interface SearchResultItem {
  id: string;
  category: "students" | "teachers" | "classes" | "remedial" | "notices";
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  score?: number;
}

const VERIFIED_STAFF = [
  {
    id: "staff-pooja",
    name: "Pooja Sharma",
    role: "Class Teacher (Class 4-A)",
    email: "teacher@studysaathi.edu.in",
    school: "Model Primary School, Gandhinagar",
    href: "/students?class=cls-4a",
  },
  {
    id: "staff-trivedi",
    name: "Principal R. K. Trivedi",
    role: "School Administrator / Principal",
    email: "principal@studysaathi.edu.in",
    school: "Model Primary School, Gandhinagar",
    href: "/settings",
  },
  {
    id: "staff-dinesh",
    name: "Dineshbhai Patel",
    role: "Parent Representative (Aarav Patel, Class 4-A)",
    email: "dinesh.patel@example.com",
    school: "Model Primary School, Gandhinagar",
    href: "/students/std-aarav",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") || "";
    const requestedCategory = (searchParams.get("category") || "all").toLowerCase();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "15", 10), 1), 50);

    const q = rawQuery.trim().toLowerCase();

    // If query is empty, return empty results with success
    if (!q) {
      return NextResponse.json({
        success: true,
        query: "",
        count: 0,
        results: [],
        categories: {
          students: 0,
          teachers: 0,
          classes: 0,
          remedial: 0,
          notices: 0,
        },
      });
    }

    const matchedResults: SearchResultItem[] = [];

    // 1. Search Students
    if (requestedCategory === "all" || requestedCategory === "students") {
      const students = db.getStudents();
      for (const s of students) {
        const nameLower = (s.displayName || "").toLowerCase();
        const codeLower = (s.studentCode || "").toLowerCase();
        const notesLower = (s.notes || "").toLowerCase();
        const classStr = `class ${s.grade} grade ${s.grade} ${s.section}`.toLowerCase();

        let score = 0;
        if (nameLower === q || codeLower === q) score += 100;
        else if (nameLower.startsWith(q) || codeLower.startsWith(q)) score += 70;
        else if (nameLower.includes(q) || codeLower.includes(q)) score += 40;
        else if (classStr.includes(q)) score += 20;
        else if (notesLower.includes(q)) score += 10;

        if (score > 0) {
          matchedResults.push({
            id: s.id,
            category: "students",
            title: s.displayName,
            subtitle: `Class ${s.grade}-${s.section} • Roll: ${s.studentCode}`,
            href: `/students/${s.id}`,
            badge: `Grade ${s.grade}`,
            score,
          });
        }
      }
    }

    // 2. Search Teachers & Staff
    if (requestedCategory === "all" || requestedCategory === "teachers") {
      for (const staff of VERIFIED_STAFF) {
        const nameLower = staff.name.toLowerCase();
        const roleLower = staff.role.toLowerCase();
        const emailLower = staff.email.toLowerCase();

        let score = 0;
        if (nameLower === q) score += 100;
        else if (nameLower.startsWith(q)) score += 70;
        else if (nameLower.includes(q)) score += 40;
        else if (roleLower.includes(q) || emailLower.includes(q)) score += 20;

        if (score > 0) {
          matchedResults.push({
            id: staff.id,
            category: "teachers",
            title: staff.name,
            subtitle: `${staff.role} • ${staff.email}`,
            href: staff.href,
            badge: "Staff",
            score,
          });
        }
      }
    }

    // 3. Search Classes & Sections
    if (requestedCategory === "all" || requestedCategory === "classes") {
      const classrooms = db.getClassrooms();
      for (const cls of classrooms) {
        const titleStr = `class ${cls.grade}-${cls.section} grade ${cls.grade} class ${cls.grade} section ${cls.section}`.toLowerCase();
        let score = 0;
        if (titleStr.includes(q) || `class ${cls.grade}` === q || `grade ${cls.grade}` === q) {
          score = 50;
        }

        if (score > 0) {
          matchedResults.push({
            id: cls.id,
            category: "classes",
            title: `Class ${cls.grade} - Section ${cls.section}`,
            subtitle: `Academic Year ${cls.academicYear} • Model Primary School`,
            href: `/students?class=${cls.id}`,
            badge: `${cls.academicYear}`,
            score,
          });
        }
      }
    }

    // 4. Search Remedial Plans & Learning Gaps
    if (requestedCategory === "all" || requestedCategory === "remedial") {
      const plans = db.getRemedialPlans();
      for (const p of plans) {
        const conceptLower = (p.conceptName || "").toLowerCase();
        const studentLower = (p.studentName || "").toLowerCase();
        const objectiveLower = (p.learningObjective || "").toLowerCase();
        const subjectLower = (p.subjectCode || "").toLowerCase();

        let score = 0;
        if (conceptLower === q) score += 90;
        else if (conceptLower.startsWith(q) || studentLower.startsWith(q)) score += 60;
        else if (conceptLower.includes(q) || studentLower.includes(q)) score += 35;
        else if (objectiveLower.includes(q) || subjectLower.includes(q)) score += 15;

        if (score > 0) {
          matchedResults.push({
            id: p.id,
            category: "remedial",
            title: `${p.conceptName} (${p.subjectCode})`,
            subtitle: `Plan for ${p.studentName} • Status: ${p.status} • ${p.difficulty || "Standard"}`,
            href: `/remedial-plans`,
            badge: p.status,
            score,
          });
        }
      }
    }

    // 5. Search Announcements & Notices
    if (requestedCategory === "all" || requestedCategory === "notices") {
      const notices = db.getNotices();
      for (const n of notices) {
        const titleLower = (n.title || "").toLowerCase();
        const contentLower = (n.originalContent || "").toLowerCase();
        const catLower = (n.category || "").toLowerCase();

        let score = 0;
        if (titleLower === q) score += 80;
        else if (titleLower.startsWith(q)) score += 50;
        else if (titleLower.includes(q)) score += 30;
        else if (contentLower.includes(q) || catLower.includes(q)) score += 15;
        else if (q === "notice" || q === "notices" || q === "announcement" || q === "announcements") score += 25;

        if (score > 0) {
          matchedResults.push({
            id: n.id,
            category: "notices",
            title: n.title,
            subtitle: `${n.originalContent.slice(0, 80)}...`,
            href: `/ai`,
            badge: n.category ? n.category.toUpperCase() : "NOTICE",
            score,
          });
        }
      }
    }

    // Sort by score descending
    matchedResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Limit total results
    const limitedResults = matchedResults.slice(0, limit);

    // Compute category counts
    const categoryCounts = {
      students: matchedResults.filter((r) => r.category === "students").length,
      teachers: matchedResults.filter((r) => r.category === "teachers").length,
      classes: matchedResults.filter((r) => r.category === "classes").length,
      remedial: matchedResults.filter((r) => r.category === "remedial").length,
      notices: matchedResults.filter((r) => r.category === "notices").length,
    };

    return NextResponse.json({
      success: true,
      query: rawQuery,
      count: limitedResults.length,
      totalMatches: matchedResults.length,
      results: limitedResults,
      categories: categoryCounts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute search.",
        results: [],
      },
      { status: 500 }
    );
  }
}
