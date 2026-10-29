import type { User, UserRole } from "../../../../packages/shared/src/types";
import { DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT } from "../../../../packages/shared/src/constants";

export class AuthService {
  async login(email: string, role: UserRole = "teacher"): Promise<User> {
    if (email.toLowerCase().includes("teacher") || email === DEMO_TEACHER.email) {
      return { ...DEMO_TEACHER, role: "teacher" };
    }
    if (email.toLowerCase().includes("principal") || email.toLowerCase().includes("admin") || email === DEMO_ADMIN.email) {
      return { ...DEMO_ADMIN, role: "admin" };
    }
    if (email.toLowerCase().includes("parent") || email === DEMO_PARENT.email) {
      return { ...DEMO_PARENT, role: "parent" };
    }
    return {
      id: `usr-${Date.now()}`,
      name: role === "admin" ? "Principal Administrator" : role === "parent" ? "Student Parent" : "Class Teacher",
      email,
      role,
      schoolId: "sch-gn-01",
    };
  }

  async getCurrentUser(authHeader?: string): Promise<User> {
    if (authHeader?.includes("admin")) {
      return DEMO_ADMIN;
    }
    if (authHeader?.includes("parent")) {
      return DEMO_PARENT;
    }
    return DEMO_TEACHER;
  }
}

export const authService = new AuthService();
