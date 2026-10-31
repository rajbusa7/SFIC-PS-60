/**
 * StudySaathi AI - Parent Bridge Responsive HTML Email Templates
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Professional, brand-aligned responsive email templates in StudySaathi AI's
 * peach-and-cream design language with zero emojis and high accessibility.
 */

import type { SchoolNotice, StudentAttendanceSummary, SupportedLanguage } from "@/lib/types";

export interface EmailTemplateOptions {
  schoolName?: string;
  portalUrl?: string;
  studentName?: string;
  language?: SupportedLanguage | string;
}

const DEFAULT_SCHOOL = "Model Primary School, Gandhinagar";
const DEFAULT_PORTAL_URL = "https://shikshasetu-ai-iota.vercel.app/parent/dashboard";

/**
 * Common HTML wrapper with StudySaathi AI styling
 */
function wrapHtmlEmail(title: string, badgeText: string, contentHtml: string, options?: EmailTemplateOptions): string {
  const schoolName = options?.schoolName || DEFAULT_SCHOOL;
  const portalUrl = options?.portalUrl || DEFAULT_PORTAL_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #FAF6E9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #49352F; -webkit-font-smoothing: antialiased; }
    table { border-collapse: separate; }
    a { color: #B26A1B; text-decoration: none; font-weight: 600; }
    .email-container { max-width: 600px; margin: 24px auto; background-color: #FFFFFF; border: 1px solid rgba(73, 53, 47, 0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(73, 53, 47, 0.05); }
    .header { background: linear-gradient(135deg, #FAF6E9 0%, #F4F1E1 50%, rgba(242, 202, 179, 0.4) 100%); padding: 24px 32px; border-bottom: 1px solid rgba(73, 53, 47, 0.1); }
    .brand-title { font-size: 20px; font-weight: 800; color: #49352F; letter-spacing: -0.5px; margin: 0; }
    .brand-sub { font-size: 12px; color: #7A6862; margin: 2px 0 0 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: rgba(178, 106, 27, 0.1); color: #B26A1B; border: 1px solid rgba(178, 106, 27, 0.25); margin-top: 10px; }
    .content-area { padding: 32px; font-size: 14px; line-height: 1.6; color: #49352F; }
    .card { background-color: #FAF6E9; border: 1px solid rgba(73, 53, 47, 0.1); border-radius: 14px; padding: 18px; margin: 18px 0; }
    .metric-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .metric-table td { padding: 8px 12px; border-bottom: 1px solid rgba(73, 53, 47, 0.08); font-size: 13px; }
    .metric-label { color: #7A6862; font-weight: 500; }
    .metric-value { text-align: right; font-weight: 700; color: #49352F; }
    .cta-button { display: inline-block; background-color: #261B16; color: #FAF6E9 !important; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 9999px; text-align: center; text-decoration: none; margin-top: 16px; box-shadow: 0 2px 8px rgba(38, 27, 22, 0.15); }
    .footer { background-color: #F4F1E1; padding: 20px 32px; border-top: 1px solid rgba(73, 53, 47, 0.08); text-align: center; font-size: 11px; color: #7A6862; }
    .footer a { color: #7A6862; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <table width="100%">
        <tr>
          <td>
            <h1 class="brand-title">StudySaathi AI</h1>
            <p class="brand-sub">${schoolName} &bull; Parent Bridge</p>
          </td>
          <td align="right" valign="top">
            <span class="badge">${badgeText}</span>
          </td>
        </tr>
      </table>
    </div>

    <div class="content-area">
      ${contentHtml}
      <div style="text-align: center; margin-top: 24px;">
        <a href="${portalUrl}" class="cta-button">Open Parent Bridge Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">This official communication was issued by ${schoolName} via StudySaathi AI.</p>
      <p style="margin: 0;">You can update your communication preferences at any time in the Parent Bridge portal.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. School Notice Email Template
 */
export function generateNoticeEmailHtml(
  notice: SchoolNotice,
  parentName: string,
  options?: EmailTemplateOptions
): string {
  const content = notice.simplifiedContent || notice.originalContent;
  const categoryLabel = (notice.category || "announcement").replace(/_/g, " ").toUpperCase();

  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      ${notice.title}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}${options?.studentName ? ` (Parent of ${options.studentName})` : ""},
    </p>
    <div class="card">
      <div style="font-size: 14px; line-height: 1.6; color: #49352F; white-space: pre-wrap;">
${content}
      </div>
    </div>
    ${
      notice.requiresAcknowledgment
        ? `<div style="background-color: rgba(178, 106, 27, 0.08); border: 1px solid rgba(178, 106, 27, 0.2); border-radius: 12px; padding: 12px 16px; margin: 16px 0; font-size: 12px; color: #49352F;">
            <strong>Acknowledgment Requested:</strong> Please review this notice and sign off in the Parent Bridge portal.
           </div>`
        : ""
    }
  `;

  return wrapHtmlEmail(notice.title, categoryLabel, body, options);
}

/**
 * 2. Student Attendance Email Template
 */
export function generateAttendanceEmailHtml(
  studentName: string,
  parentName: string,
  attendance: StudentAttendanceSummary,
  options?: EmailTemplateOptions
): string {
  const isAttentionNeeded = attendance.attendanceRate < 85;
  const badgeText = isAttentionNeeded ? "Attendance Alert" : "Attendance Update";

  const absencesHtml =
    attendance.recentAbsences && attendance.recentAbsences.length > 0
      ? attendance.recentAbsences
          .map(
            (a) => `
          <tr>
            <td>${a.date}</td>
            <td>${a.reason || "Not specified"}</td>
            <td align="right">${a.isExcused ? "Excused" : "Unexcused"}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="text-align: center; color: #7A6862;">No recent unexcused absences recorded.</td></tr>`;

  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      Attendance Report: ${studentName}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}, here is the current academic attendance summary for ${studentName}.
    </p>

    <div class="card">
      <table class="metric-table">
        <tr>
          <td class="metric-label">Overall Attendance Rate</td>
          <td class="metric-value" style="color: ${isAttentionNeeded ? "#C54738" : "#2E7D5E"}; font-size: 16px;">
            ${attendance.attendanceRate}%
          </td>
        </tr>
        <tr>
          <td class="metric-label">Total School Days</td>
          <td class="metric-value">${attendance.totalDays} days</td>
        </tr>
        <tr>
          <td class="metric-label">Days Present</td>
          <td class="metric-value">${attendance.presentDays} days</td>
        </tr>
        <tr>
          <td class="metric-label">Days Absent</td>
          <td class="metric-value">${attendance.absentDays} days</td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; color: #49352F;">
      Recent Absence Log
    </h3>
    <table class="metric-table" style="background-color: #FAF6E9; border-radius: 10px;">
      <thead>
        <tr style="border-bottom: 1px solid rgba(73, 53, 47, 0.12);">
          <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7A6862;">Date</th>
          <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7A6862;">Reason</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #7A6862;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${absencesHtml}
      </tbody>
    </table>

    <p style="font-size: 12px; color: #7A6862; margin-top: 16px;">
      Regular school attendance ensures uninterrupted learning foundational skills. If your child will be absent, please notify the class teacher through the Parent Bridge.
    </p>
  `;

  return wrapHtmlEmail(`Attendance Report: ${studentName}`, badgeText, body, options);
}

/**
 * 3. Academic Performance Report Email Template
 */
export function generateAcademicReportEmailHtml(
  studentName: string,
  parentName: string,
  data: {
    averagePercentage: number;
    trend: "improving" | "steady" | "needs_support";
    recentAssessments: Array<{ title: string; subject: string; score: number; maxScore: number; percentage: number }>;
    teacherFeedback?: string;
  },
  options?: EmailTemplateOptions
): string {
  const trendLabel =
    data.trend === "improving"
      ? "Improving Trend"
      : data.trend === "steady"
      ? "Steady Performance"
      : "Attention Recommended";

  const rowsHtml = data.recentAssessments
    .map(
      (a) => `
      <tr>
        <td style="font-weight: 600;">${a.title}</td>
        <td style="color: #7A6862;">${a.subject}</td>
        <td align="right" style="font-weight: 700;">${a.score}/${a.maxScore} (${a.percentage}%)</td>
      </tr>`
    )
    .join("");

  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      Academic Performance: ${studentName}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}, here is the latest classroom assessment summary for ${studentName}.
    </p>

    <div class="card">
      <table class="metric-table">
        <tr>
          <td class="metric-label">Term Average Score</td>
          <td class="metric-value" style="font-size: 16px; color: #B26A1B;">${data.averagePercentage}%</td>
        </tr>
        <tr>
          <td class="metric-label">Learning Trajectory</td>
          <td class="metric-value">${trendLabel}</td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 14px; font-weight: 700; margin: 20px 0 8px 0; color: #49352F;">
      Recent Assessment Details
    </h3>
    <table class="metric-table" style="background-color: #FAF6E9; border-radius: 10px;">
      <thead>
        <tr style="border-bottom: 1px solid rgba(73, 53, 47, 0.12);">
          <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7A6862;">Assessment</th>
          <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #7A6862;">Subject</th>
          <th style="padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #7A6862;">Score</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    ${
      data.teacherFeedback
        ? `<div style="background-color: rgba(46, 125, 94, 0.08); border: 1px solid rgba(46, 125, 94, 0.2); border-radius: 12px; padding: 14px 18px; margin-top: 16px;">
            <strong style="color: #2E7D5E; font-size: 12px; text-transform: uppercase;">Teacher Observation:</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #49352F; line-height: 1.5;">${data.teacherFeedback}</p>
           </div>`
        : ""
    }
  `;

  return wrapHtmlEmail(`Academic Report: ${studentName}`, "Academic Progress", body, options);
}

/**
 * 4. Learning Gap & Cognitive Obstacle Email Template
 */
export function generateLearningGapEmailHtml(
  studentName: string,
  parentName: string,
  gap: {
    conceptName: string;
    subject: string;
    priority: string;
    status: string;
    score: number;
    whyFlaggedDiagnosis: string;
    recommendedHomeActivity?: string;
  },
  options?: EmailTemplateOptions
): string {
  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      Learning Support Notice: ${studentName}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}, our pedagogical assessment has identified a concept where ${studentName} can benefit from additional practice at home and school.
    </p>

    <div class="card">
      <table class="metric-table">
        <tr>
          <td class="metric-label">Subject & Concept</td>
          <td class="metric-value">${gap.subject} &bull; ${gap.conceptName}</td>
        </tr>
        <tr>
          <td class="metric-label">Current Mastery Score</td>
          <td class="metric-value" style="color: #C54738;">${gap.score}% (Developing)</td>
        </tr>
        <tr>
          <td class="metric-label">Priority Level</td>
          <td class="metric-value">${gap.priority.toUpperCase()}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: rgba(178, 106, 27, 0.08); border: 1px solid rgba(178, 106, 27, 0.2); border-radius: 12px; padding: 16px; margin: 16px 0;">
      <strong style="color: #B26A1B; font-size: 12px; text-transform: uppercase;">Why Flagged (Teacher Diagnosis):</strong>
      <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; color: #49352F;">
        ${gap.whyFlaggedDiagnosis}
      </p>
    </div>

    ${
      gap.recommendedHomeActivity
        ? `<div style="background-color: #FAF6E9; border: 1px solid rgba(73, 53, 47, 0.12); border-radius: 12px; padding: 16px; margin: 16px 0;">
            <strong style="color: #49352F; font-size: 12px; text-transform: uppercase;">Recommended Home Practice:</strong>
            <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; color: #49352F;">
              ${gap.recommendedHomeActivity}
            </p>
           </div>`
        : ""
    }

    <p style="font-size: 12px; color: #7A6862; margin-top: 14px;">
      A targeted 5-Step Remedial Plan has been designed by the teacher. You can follow step-by-step guidance in the Parent Bridge.
    </p>
  `;

  return wrapHtmlEmail(`Learning Support: ${studentName}`, "Learning Gap", body, options);
}

/**
 * 5. Remedial 5-Step Learning Plan Email Template
 */
export function generateRemedialPlanEmailHtml(
  studentName: string,
  parentName: string,
  plan: {
    conceptName: string;
    learningObjective: string;
    steps: Array<{ stepNumber: number; title: string; description: string; durationMinutes?: number }>;
    practiceInstructions?: string;
    expectedOutcomes?: string;
  },
  options?: EmailTemplateOptions
): string {
  const stepsHtml = plan.steps
    .map(
      (st) => `
      <div style="margin-bottom: 12px; padding: 12px; background-color: #FFFFFF; border: 1px solid rgba(73, 53, 47, 0.08); border-radius: 8px;">
        <strong style="color: #B26A1B; font-size: 12px;">Step ${st.stepNumber}: ${st.title}</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #49352F; line-height: 1.4;">${st.description}</p>
      </div>`
    )
    .join("");

  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      5-Step Remedial Learning Plan: ${studentName}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}, here is the customized 5-step learning plan prepared for ${studentName} to master <strong>${plan.conceptName}</strong>.
    </p>

    <div class="card">
      <strong style="color: #7A6862; font-size: 11px; text-transform: uppercase;">Learning Objective:</strong>
      <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #49352F;">
        ${plan.learningObjective}
      </p>
    </div>

    <h3 style="font-size: 14px; font-weight: 700; margin: 18px 0 10px 0; color: #49352F;">
      Step-by-Step Learning Sequence
    </h3>
    <div style="background-color: #FAF6E9; padding: 12px; border-radius: 12px; border: 1px solid rgba(73, 53, 47, 0.1);">
      ${stepsHtml}
    </div>

    ${
      plan.practiceInstructions
        ? `<div style="margin-top: 14px; font-size: 12px; color: #7A6862; line-height: 1.5;">
            <strong>Home Practice Note:</strong> ${plan.practiceInstructions}
           </div>`
        : ""
    }
  `;

  return wrapHtmlEmail(`Remedial Plan: ${studentName}`, "Remedial Plan", body, options);
}

/**
 * 6. General School Update / Homework Reminder Email Template
 */
export function generateGeneralUpdateEmailHtml(
  studentName: string,
  parentName: string,
  update: {
    title: string;
    subject?: string;
    content: string;
    dueDate?: string;
    teacherName?: string;
  },
  options?: EmailTemplateOptions
): string {
  const body = `
    <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 12px 0; color: #49352F;">
      ${update.title}
    </h2>
    <p style="margin: 0 0 16px 0; color: #7A6862; font-size: 13px;">
      Dear ${parentName}, this is a student update regarding ${studentName}.
    </p>

    <div class="card">
      ${
        update.subject
          ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #7A6862;"><strong>Subject:</strong> ${update.subject}</p>`
          : ""
      }
      <div style="font-size: 14px; line-height: 1.6; color: #49352F; white-space: pre-wrap;">
${update.content}
      </div>
      ${
        update.dueDate
          ? `<p style="margin: 12px 0 0 0; font-size: 12px; color: #B26A1B;"><strong>Due Date:</strong> ${update.dueDate}</p>`
          : ""
      }
    </div>
  `;

  return wrapHtmlEmail(update.title, "School Update", body, options);
}
