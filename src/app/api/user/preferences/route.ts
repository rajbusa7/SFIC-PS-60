import { NextResponse } from "next/server";
import { extractSessionToken, verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db/database";
import {
  isValidLanguageCode,
  LANGUAGE_REGISTRY,
} from "@/lib/i18n/registry";
import type { SupportedLanguage, SupportedScript } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = await extractSessionToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const user =
      (await db.getUserByIdAsync(session.id)) ||
      (await db.getUserByEmailAsync(session.email));
    const parentProfile =
      session.role === "parent"
        ? await db.getParentByUserIdAsync(session.id)
        : null;

    const preferredLanguage =
      user?.preferredLanguage ||
      parentProfile?.preferredLanguage ||
      "en";
    const preferredScript =
      user?.preferredScript ||
      parentProfile?.preferredScript ||
      undefined;

    return NextResponse.json({
      success: true,
      preferences: {
        preferredLanguage,
        preferredScript,
        role: session.role,
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/user/preferences error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load user preferences." },
      { status: 500 }
    );
  }
}

async function updatePreferencesHandler(request: Request) {
  try {
    const token = await extractSessionToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawLang = body?.preferredLanguage;
    const rawScript = body?.preferredScript;

    if (!isValidLanguageCode(rawLang)) {
      return NextResponse.json(
        { success: false, error: "Unsupported language code." },
        { status: 400 }
      );
    }

    const langConfig = LANGUAGE_REGISTRY[rawLang as SupportedLanguage];
    let resolvedScript: SupportedScript = langConfig.defaultScript;

    if (rawScript !== undefined && rawScript !== null && rawScript !== "") {
      const matched = langConfig.scriptVariants.find((v) => v.script === rawScript);
      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            error: `Script '${rawScript}' is not configured for language '${rawLang}'.`,
          },
          { status: 400 }
        );
      }
      resolvedScript = matched.script;
    }

    const updatedUser = await db.updateUserAsync(session.id, {
      preferredLanguage: rawLang,
      preferredScript: resolvedScript,
    });

    if (session.role === "parent") {
      await db.updateParentPreferencesAsync(session.id, {
        preferredLanguage: rawLang,
        preferredScript: resolvedScript,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        preferredLanguage: updatedUser?.preferredLanguage || rawLang,
        preferredScript: updatedUser?.preferredScript || resolvedScript,
      },
    });
  } catch (error: unknown) {
    console.error("[PATCH /api/user/preferences error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save user preferences." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return updatePreferencesHandler(request);
}

export async function PUT(request: Request) {
  return updatePreferencesHandler(request);
}
