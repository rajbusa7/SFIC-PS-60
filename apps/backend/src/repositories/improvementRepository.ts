import { db } from "../../../../src/lib/db/database";
import type {
  LearningImprovementRecord,
  ClassImprovementSummary,
  RecordFollowUpAssessmentRequest,
} from "../../../../packages/shared/src/types";

export class ImprovementRepository {
  find(filter?: {
    studentId?: string;
    conceptId?: string;
    classroomId?: string;
    status?: string;
  }): LearningImprovementRecord[] {
    return db.getImprovements(filter);
  }

  evaluateForStudent(studentId: string, conceptId: string): LearningImprovementRecord | null {
    return db.evaluateStudentImprovement(studentId, conceptId);
  }

  recordFollowUp(params: RecordFollowUpAssessmentRequest) {
    return db.recordFollowUpAssessment(params);
  }

  compare(
    studentId: string,
    conceptId: string,
    preTestAssessmentId?: string,
    postTestAssessmentId?: string
  ) {
    return db.compareAssessments(studentId, conceptId, preTestAssessmentId, postTestAssessmentId);
  }

  getSummary(classroomId?: string): ClassImprovementSummary {
    return db.getClassroomImprovementSummary(classroomId);
  }
}

export const improvementRepository = new ImprovementRepository();
