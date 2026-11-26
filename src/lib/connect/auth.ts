import { extractSessionToken, verifySession, type SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/database";

export async function getConnectUser(request: Request): Promise<SessionUser | null> {
  // 1. Check cryptographic session cookie or Authorization header
  const token = await extractSessionToken(request);
  if (token) {
    const verified = await verifySession(token);
    if (verified) return verified;
  }

  // 2. Check X-User-Id or demo authorization headers (used in testing & demo workflows)
  const headerUserId = request.headers.get("x-user-id");
  const headerRole = request.headers.get("x-user-role");

  if (headerUserId) {
    const user = db.getUserById(headerUserId);
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      };
    }
    // Check if it's a parent profile ID
    const parent = db.getParentById(headerUserId) || db.getParentByUserId(headerUserId);
    if (parent) {
      return {
        id: parent.userId || parent.id,
        name: parent.name,
        email: parent.email || "parent@example.com",
        role: "parent",
        schoolId: "sch-gn-01",
      };
    }
  }

  // 3. Demo fallback if user role specified
  if (headerRole === "admin") {
    return {
      id: "usr-admin-01",
      name: "Principal R. K. Trivedi",
      email: "principal@studysaathi.edu.in",
      role: "admin",
      schoolId: "sch-gn-01",
    };
  } else if (headerRole === "parent") {
    return {
      id: "par-001",
      name: "Dineshbhai Patel",
      email: "dinesh.patel@example.com",
      role: "parent",
      schoolId: "sch-gn-01",
    };
  } else if (headerRole === "teacher") {
    return {
      id: "usr-teacher-01",
      name: "Pooja Sharma",
      email: "teacher@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
    };
  }

  return null;
}
