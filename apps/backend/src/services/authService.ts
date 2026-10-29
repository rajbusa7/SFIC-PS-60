import type { User, UserRole } from "../../../../packages/shared/src/types";
import { DEMO_TEACHER, DEMO_ADMIN } from "../../../../packages/shared/src/constants";

export class AuthService {
  async login(email: string, role: UserRole = "teacher"): Promise<User> {
    if (email.toLowerCase().includes("teacher") || email === DEMO_TEACHER.email) {
      return { ...DEMO_TEACHER, role: "teacher" };
    }
    if (email.toLowerCase().includes("principal") || email.toLowerCase().includes("admin") || email === DEMO_ADMIN.email) {
      return { ...DEMO_ADMIN, role: "admin" };
    }
    return {
      id: `usr-${Date.now()}`,
      name: role === "admin" ? "Principal Administrator" : "Class Teacher",
      email,
      role,
      schoolId: "sch-gn-01",
    };
  }

  async getCurrentUser(authHeader?: string): Promise<User> {
    // In demo environment, defaults to DEMO_TEACHER
    if (authHeader?.includes("admin")) {
      return DEMO_ADMIN;
    }
    return DEMO_TEACHER;
  }
}

export const authService = new AuthService();
