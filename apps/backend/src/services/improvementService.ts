import { improvementRepository } from "../repositories/improvementRepository";
import { studentRepository } from "../repositories/studentRepository";
import type {
  LearningImprovementRecord,
  ClassImprovementSummary,
  RecordFollowUpAssessmentRequest,
} from "../../../../packages/shared/src/types";

export class ImprovementService {
  async getImprovements(
    filter?: {
      studentId?: string;
      conceptId?: string;
      classroomId?: string;
      status?: string;
    },
    userContext?: { role?: string; studentId?: string }
  ): Promise<LearningImprovementRecord[]> {
    // Parent Data Isolation: Parents can ONLY view records for their linked child
    if (userContext?.role === "parent") {
      if (!userContext.studentId) {
        throw new Error("Unauthorized: Parent profile is not linked to a student");
      }
      if (filter?.studentId && filter.studentId !== userContext.studentId) {
        throw new Error("Unauthorized: Parents can only access their own child's improvement data");
      }
      filter = { ...filter, studentId: userContext.studentId };
    }

    if (filter?.studentId) {
      const student = await studentRepository.findById(filter.studentId);
      if (!student) {
        throw new Error(`Student '${filter.studentId}' not found`);
      }
    }

    return improvementRepository.find(filter);
  }

  async recordFollowUp(
    params: RecordFollowUpAssessmentRequest,
    userContext?: { role?: string }
  ) {
    if (userContext?.role === "parent") {
      throw new Error("Unauthorized: Only teachers and administrators can record assessment scores");
    }

    const student = await studentRepository.findById(params.studentId);
    if (!student) {
      throw new Error(`Student '${params.studentId}' not found`);
    }

    return improvementRepository.recordFollowUp(params);
  }

  async compare(
    studentId: string,
    conceptId: string,
    preTestAssessmentId?: string,
    postTestAssessmentId?: string,
    userContext?: { role?: string; studentId?: string }
  ) {
    if (userContext?.role === "parent") {
      if (!userContext.studentId || userContext.studentId !== studentId) {
        throw new Error("Unauthorized: Parents can only access their own child's evaluation data");
      }
    }

    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new Error(`Student '${studentId}' not found`);
    }

    return improvementRepository.compare(studentId, conceptId, preTestAssessmentId, postTestAssessmentId);
  }

  async getClassSummary(classroomId?: string): Promise<ClassImprovementSummary> {
    return improvementRepository.getSummary(classroomId);
  }
}

export const improvementService = new ImprovementService();
