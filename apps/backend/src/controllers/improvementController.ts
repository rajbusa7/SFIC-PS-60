import type { Request, Response } from "express";
import { improvementService } from "../services/improvementService";

export class ImprovementController {
  async getAll(req: Request, res: Response) {
    try {
      const studentId = req.query.studentId as string | undefined;
      const conceptId = req.query.conceptId as string | undefined;
      const classroomId = req.query.classroomId as string | undefined;
      const status = req.query.status as string | undefined;

      const userContext = {
        role: (req as any).user?.role || (req.headers["x-user-role"] as string),
        studentId: (req as any).user?.studentId || (req.headers["x-student-id"] as string),
      };

      const improvements = await improvementService.getImprovements(
        { studentId, conceptId, classroomId, status },
        userContext
      );

      res.status(200).json({ success: true, count: improvements.length, improvements });
    } catch (err: any) {
      const statusCode = err.message?.includes("Unauthorized") ? 403 : err.message?.includes("not found") ? 404 : 500;
      res.status(statusCode).json({ success: false, error: err.message || "Failed to fetch improvements" });
    }
  }

  async getByStudent(req: Request, res: Response) {
    try {
      const studentId = String(req.params.studentId);
      const userContext = {
        role: (req as any).user?.role || (req.headers["x-user-role"] as string),
        studentId: (req as any).user?.studentId || (req.headers["x-student-id"] as string),
      };

      const improvements = await improvementService.getImprovements(
        { studentId },
        userContext
      );

      res.status(200).json({ success: true, count: improvements.length, improvements });
    } catch (err: any) {
      const statusCode = err.message?.includes("Unauthorized") ? 403 : err.message?.includes("not found") ? 404 : 500;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  async recordFollowUp(req: Request, res: Response) {
    try {
      const {
        studentId,
        conceptId,
        assessmentId,
        marksObtained,
        maximumMarks,
        notes,
        assessmentDate,
        remedialPlanId,
      } = req.body;

      if (!studentId || !conceptId || !assessmentId || marksObtained === undefined || maximumMarks === undefined) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters: studentId, conceptId, assessmentId, marksObtained, and maximumMarks are mandatory.",
        });
      }

      const userContext = {
        role: (req as any).user?.role || (req.headers["x-user-role"] as string),
      };

      const result = await improvementService.recordFollowUp(
        {
          studentId,
          conceptId,
          assessmentId,
          marksObtained: Number(marksObtained),
          maximumMarks: Number(maximumMarks),
          notes,
          assessmentDate,
          remedialPlanId,
        },
        userContext
      );

      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      const statusCode = err.message?.includes("Unauthorized") ? 403 : err.message?.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  async compare(req: Request, res: Response) {
    try {
      const { studentId, conceptId, preTestAssessmentId, postTestAssessmentId } = req.body;
      if (!studentId || !conceptId) {
        return res.status(400).json({ success: false, error: "studentId and conceptId are required." });
      }

      const userContext = {
        role: (req as any).user?.role || (req.headers["x-user-role"] as string),
        studentId: (req as any).user?.studentId || (req.headers["x-student-id"] as string),
      };

      const comparison = await improvementService.compare(
        studentId,
        conceptId,
        preTestAssessmentId,
        postTestAssessmentId,
        userContext
      );

      res.status(200).json({ success: true, comparison });
    } catch (err: any) {
      const statusCode = err.message?.includes("Unauthorized") ? 403 : err.message?.includes("not found") ? 404 : 400;
      res.status(statusCode).json({ success: false, error: err.message });
    }
  }

  async getSummary(req: Request, res: Response) {
    try {
      const classroomId = req.query.classroomId as string | undefined;
      const summary = await improvementService.getClassSummary(classroomId);
      res.status(200).json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to fetch class summary" });
    }
  }
}

export const improvementController = new ImprovementController();
