import { NextResponse } from "next/server";
import { extractSessionToken, verifySession, type SessionUser } from "@/lib/auth/session";
import type { UserRole } from "@shared/types";
import { DEMO_TEACHER, DEMO_ADMIN, DEMO_PARENT } from "@shared/constants";
import type { ActorContext } from "@backend/services/ptmService";
import { PtmAuthorizationError, PtmValidationError } from "@backend/services/ptmService";
import { db } from "@/lib/db/database";

export async function resolveNextActor(request: Request): Promise<ActorContext | null> {
  // 1. Try cryptographic session token (HMAC-SHA256 cookie or Bearer token)
  const token = await extractSessionToken(request);
  if (token && !token.startsWith("demo-")) {
    const session: SessionUser | null = await verifySession(token);
    if (session) {
      return {
        id: session.id,
        name: session.name,
        role: session.role,
        email: session.email,
      };
    }
  }

  // 2. Fallback to client headers (X-User-Role, X-User-Id, X-User-Email, Authorization) sent by apiClient
  const roleHeader = (request.headers.get("x-user-role") || "").toLowerCase().trim();
  const authHeader = (request.headers.get("authorization") || "").toLowerCase().trim();
  const userIdHeader = request.headers.get("x-user-id")?.trim() || "";
  const userEmailHeader = request.headers.get("x-user-email")?.trim() || "";

  let role: UserRole | null = null;
  if (roleHeader === "admin" || authHeader.includes("admin")) role = "admin";
  else if (roleHeader === "parent" || authHeader.includes("parent")) role = "parent";
  else if (roleHeader === "teacher" || authHeader.includes("teacher")) role = "teacher";

  if (!role && !userIdHeader && !userEmailHeader) {
    return null;
  }

  // Look up user from persistent database if id or email provided
  if (userIdHeader) {
    const user = await db.getUserByIdAsync(userIdHeader);
    if (user && user.status !== "disabled") {
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      };
    }
  }

  if (userEmailHeader) {
    const user = await db.getUserByEmailAsync(userEmailHeader);
    if (user && user.status !== "disabled") {
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      };
    }
  }

  // Fallback to demo profiles if role matches
  if (role) {
    const base = role === "admin" ? DEMO_ADMIN : role === "parent" ? DEMO_PARENT : DEMO_TEACHER;
    return {
      id: userIdHeader || base.id,
      name: base.name,
      role,
      email: userEmailHeader || base.email,
    };
  }

  return null;
}

export async function requireNextActor(
  request: Request,
  allowedRoles: UserRole[]
): Promise<{ actor: ActorContext } | { response: NextResponse }> {
  const actor = await resolveNextActor(request);

  if (!actor) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please sign in or your session has expired.",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(actor.role)) {
    return {
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Role '${actor.role}' is not authorized for this action. Allowed roles: ${allowedRoles.join(", ")}.`,
        },
        { status: 403 }
      ),
    };
  }

  return { actor };
}

export function ptmErrorResponse(err: any) {
  if (err instanceof PtmAuthorizationError || err instanceof PtmValidationError) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.status });
  }
  return NextResponse.json(
    { success: false, error: err.message || "Internal server error" },
    { status: 500 }
  );
}

export async function getNextPtmActor(request: Request): Promise<ActorContext | null> {
  return resolveNextActor(request);
}
