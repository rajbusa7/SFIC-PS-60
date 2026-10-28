import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { GET as getSettings, PUT as putSettings } from "../src/app/api/settings/route";
import { signSession } from "../src/lib/auth/session";

describe("StudySaathi AI - Customizable AI Assistant Name & Branding Suite", () => {
  it("1. Default Name: initial settings return 'Study Buddy' if unspecified", async () => {
    const settings = db.getSettings();
    assert.ok(settings.aiAssistantName, "aiAssistantName should be defined");
    assert.equal(typeof settings.aiAssistantName, "string");
  });

  it("2. GET /api/settings: returns settings with aiAssistantName", async () => {
    const res = await getSettings();
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.settings);
    assert.ok(data.settings.aiAssistantName);
  });

  it("3. Validation: rejects empty or whitespace-only name with HTTP 400", async () => {
    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
      },
      body: JSON.stringify({ aiAssistantName: "   " }),
    });

    const res = await putSettings(req);
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.error, /cannot be empty/i);
  });

  it("4. Validation: rejects name exceeding 60 characters with HTTP 400", async () => {
    const longName = "A".repeat(61);
    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
      },
      body: JSON.stringify({ aiAssistantName: longName }),
    });

    const res = await putSettings(req);
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.match(data.error, /cannot exceed 60 characters/i);
  });

  it("5. RBAC Protection: non-admin / teacher cannot modify global assistant name (HTTP 403)", async () => {
    // Session token with role "teacher"
    const teacherToken = await signSession({
      id: "teacher-test-01",
      email: "teacher@test.com",
      name: "Pooja Sharma",
      role: "teacher",
      schoolId: "sch-gn-01",
    });

    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `studysaathi_session=${teacherToken}`,
      },
      body: JSON.stringify({ aiAssistantName: "Hacked Assistant" }),
    });

    const res = await putSettings(req);
    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.match(data.error, /administrators/i);
  });

  it("6. Admin Authorization: admin successfully updates AI Assistant Name to 'Vidya Assistant'", async () => {
    const adminToken = await signSession({
      id: "admin-test-01",
      email: "admin@test.com",
      name: "Principal Mehta",
      role: "admin",
      schoolId: "sch-gn-01",
    });

    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `studysaathi_session=${adminToken}`,
      },
      body: JSON.stringify({ aiAssistantName: "Vidya Assistant" }),
    });

    const res = await putSettings(req);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.settings.aiAssistantName, "Vidya Assistant");
  });

  it("7. Database Persistence: verifying directly from DB confirms 'Vidya Assistant' was saved", async () => {
    const persisted = db.getSettings();
    assert.equal(persisted.aiAssistantName, "Vidya Assistant");
  });

  it("8. Brand Separation: Changing AI Assistant Name leaves application & school name intact", async () => {
    const school = db.getSchool();
    assert.equal(school.name, "Model Primary School, Gandhinagar");
    assert.equal(school.code, "GUJ-GNR-042");
  });

  it("9. Reset to Default: Admin restores assistant name to 'Study Buddy'", async () => {
    const req = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "admin",
      },
      body: JSON.stringify({ aiAssistantName: "Study Buddy" }),
    });

    const res = await putSettings(req);
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.settings.aiAssistantName, "Study Buddy");

    const recheck = db.getSettings();
    assert.equal(recheck.aiAssistantName, "Study Buddy");
  });
});
