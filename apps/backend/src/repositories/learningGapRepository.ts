import { db } from "../../../../src/lib/db/database";
import type { LearningGap } from "../../../../packages/shared/src/types";

export class LearningGapRepository {
  async findAll(
    filters?: {
      studentId?: string;
      classroomId?: string;
      grade?: number;
      subjectCode?: any;
      conceptId?: string;
      priority?: any;
      status?: any;
      masteryStatus?: any;
    } | string,
    priority?: string,
    status?: string
  ): Promise<LearningGap[]> {
    if (typeof filters === "string") {
      let gaps = db.getLearningGaps(filters);
      if (priority) {
        gaps = gaps.filter((g) => g.priority.toLowerCase() === priority.toLowerCase());
      }
      if (status) {
        gaps = gaps.filter((g) => g.status.toLowerCase() === status.toLowerCase());
      }
      return gaps;
    }
    return db.getLearningGaps(filters);
  }

  async findByStudentId(studentId: string): Promise<LearningGap[]> {
    return db.getLearningGaps(studentId);
  }

  async recalculateForStudent(studentId: string): Promise<LearningGap[]> {
    return db.recalculateLearningGapsForStudent(studentId);
  }
}

export const learningGapRepository = new LearningGapRepository();
