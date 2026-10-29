import { db } from "../../../../src/lib/db/database";
import type { Student, Classroom } from "../../../../packages/shared/src/types";

export class StudentRepository {
  async findAll(classroomId?: string, grade?: number, search?: string): Promise<Student[]> {
    let students = db.getStudents(classroomId);
    if (grade) {
      students = students.filter((s) => s.grade === grade);
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) => s.displayName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q)
      );
    }
    return students;
  }

  async findById(id: string): Promise<Student | null> {
    const student = db.getStudentById(id);
    return student || null;
  }

  async create(data: Omit<Student, "id" | "createdAt">): Promise<Student> {
    return db.addStudent(data);
  }

  async update(id: string, updates: Partial<Student>): Promise<Student | null> {
    return db.updateStudent(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return db.deleteStudent(id);
  }

  async getClassrooms(): Promise<Classroom[]> {
    return db.getClassrooms();
  }
}

export const studentRepository = new StudentRepository();
