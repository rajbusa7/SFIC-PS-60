import type { User, UserRole } from "../../../../packages/shared/src/types";
import { DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT } from "../../../../packages/shared/src/constants";
import { db } from "../../../../src/lib/db/database";
import { verifyPassword } from "../../../../src/lib/auth/password";

export class AuthService {
  async login(email: string, password?: string, role?: UserRole): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Look up user from persistent database
    let user = await db.getUserByEmailAsync(normalizedEmail);

    // If not found in database, check if it's one of the demo users and ensure it's in the DB
    if (!user) {
      if (normalizedEmail === DEMO_TEACHER.email.toLowerCase()) {
        user = await db.upsertUserAsync(DEMO_TEACHER);
      } else if (normalizedEmail === DEMO_ADMIN.email.toLowerCase()) {
        user = await db.upsertUserAsync(DEMO_ADMIN);
      } else if (normalizedEmail === DEMO_PARENT.email.toLowerCase()) {
        user = await db.upsertUserAsync(DEMO_PARENT);
      }
    }

    if (!user) {
      throw new Error("No account found with this email. Please create a new account first.");
    }

    // If role was explicitly specified, verify role compatibility
    if (role && user.role !== role) {
      if (role === "parent" && user.role !== "parent") {
        throw new Error("This account is registered as a school staff account. Please use the Teacher Login portal.");
      } else if (role !== "parent" && user.role === "parent") {
        throw new Error("This account is registered as a Parent account. Please sign in via the Parent Portal.");
      }
    }

    if (user.status === "disabled") {
      throw new Error("This account has been disabled. Please contact an administrator.");
    }

    // Verify password if user has passwordHash and password was provided
    if (user.passwordHash && password) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        throw new Error("Invalid password. Please try again.");
      }
    }

    return user;
  }

  async getCurrentUser(authHeader?: string, userId?: string): Promise<User> {
    if (userId) {
      const user = await db.getUserByIdAsync(userId);
      if (user) return user;
    }
    if (authHeader?.includes("admin")) {
      const admin = await db.getUserByEmailAsync(DEMO_ADMIN.email);
      if (admin) return admin;
      return DEMO_ADMIN;
    }
    if (authHeader?.includes("parent")) {
      const parent = await db.getUserByEmailAsync(DEMO_PARENT.email);
      if (parent) return parent;
      return DEMO_PARENT;
    }
    const defaultUser = await db.getUserByEmailAsync(DEMO_TEACHER.email);
    return defaultUser || DEMO_TEACHER;
  }
}

export const authService = new AuthService();
