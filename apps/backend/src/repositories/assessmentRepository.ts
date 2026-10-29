import { db } from "../../../../src/lib/db/database";
import type { Assessment, AssessmentResult, Subject, Concept } from "../../../../packages/shared/src/types";

export class AssessmentRepository {
  async findAll(classroomId?: string, subjectId?: string): Promise<Assessment[]> {
    let list = db.getAssessments(classroomId);
    if (subjectId) {
      list = list.filter((a) => a.subjectId === subjectId);
    }
    return list;
  }

  async findById(id: string): Promise<Assessment | null> {
    return db.getAssessmentById(id) || null;
  }

  async create(
    data: Omit<Assessment, "id" | "createdAt">,
    initialResults?: Omit<AssessmentResult, "id" | "assessmentId">[]
  ): Promise<Assessment> {
    return db.createAssessment(data, initialResults);
  }

  async update(
    id: string,
    updates: Partial<Assessment>,
    resultsUpdates?: any[]
  ): Promise<Assessment | null> {
    return db.updateAssessment(id, updates, resultsUpdates);
  }

  async delete(id: string): Promise<boolean> {
    return db.deleteAssessment(id);
  }

  async updateResult(id: string, updates: Partial<AssessmentResult>): Promise<AssessmentResult | null> {
    return db.updateResult(id, updates);
  }

  async deleteResult(id: string): Promise<boolean> {
    return db.deleteResult(id);
  }

  async getResults(studentId?: string, conceptId?: string): Promise<AssessmentResult[]> {
    return db.getResults(studentId, conceptId);
  }

  async recordResults(resultsData: Omit<AssessmentResult, "id">[]): Promise<AssessmentResult[]> {
    return db.recordResults(resultsData);
  }

  async getSubjects(): Promise<Subject[]> {
    return db.getSubjects();
  }

  async getConcepts(subjectId?: string): Promise<Concept[]> {
    return db.getConcepts(subjectId);
  }

  async getConceptById(id: string): Promise<Concept | null> {
    return db.getConceptById(id) || null;
  }
}

export const assessmentRepository = new AssessmentRepository();
