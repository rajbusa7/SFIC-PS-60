import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db/database";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { POST as registerParentHandler } from "../src/app/api/auth/register-parent/route";
import { POST as redeemCodeHandler } from "../src/app/api/parent/link-code/route";
import { GET as parentMeHandler } from "../src/app/api/parent/me/route";
import { GET as parentStudentHandler } from "../src/app/api/parent/students/[id]/route";
import {
  GET as getStudentLinkCodesHandler,
  POST as generateLinkCodeHandler,
  DELETE as revokeLinkCodeHandler,
} from "../src/app/api/students/[id]/link-code/route";

function makeAuthRequest(url: string, method: string, token?: string, body?: any) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`);
  }
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("Parent-Child Linking End-to-End Verification", () => {
  const ts = Date.now();
  let teacher01Token = "";
  let teacher02Token = "";
  let parentToken = "";
  let secondParentToken = "";
  let parentUserId = "";
  let parentProfileId = "";

  before(async () => {
    db.resetToDemoData();

    teacher01Token = await signSession({
      id: "usr-teacher-01",
      name: "Pooja Sharma",
      email: "teacher@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    // Teacher 02 is assigned ONLY Grade 1 ENG (not Grade 4 std-aarav)
    teacher02Token = await signSession({
      id: "usr-teacher-02",
      name: "Priya Patel",
      email: "priya.patel@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const regReq1 = makeAuthRequest("http://localhost:3000/api/auth/register-parent", "POST", undefined, {
      name: "Manisha Patel",
      email: `manisha.verify.${ts}@example.com`,
      phone: "9865412374",
      password: "VerifyParent2026!",
      confirmPassword: "VerifyParent2026!",
      preferredLanguage: "gu",
    });
    const regRes1 = await registerParentHandler(regReq1);
    const regData1 = await regRes1.json();
    assert.equal(regRes1.status, 200);
    parentUserId = regData1.user.id;
    parentProfileId = regData1.parentProfile.id;
    parentToken = await signSession({
      id: regData1.user.id,
      name: regData1.user.name,
      email: regData1.user.email,
      role: "parent",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    const regReq2 = makeAuthRequest("http://localhost:3000/api/auth/register-parent", "POST", undefined, {
      name: "Other Parent",
      email: `other.verify.${ts}@example.com`,
      password: "VerifyParent2026!",
      confirmPassword: "VerifyParent2026!",
    });
    const regRes2 = await registerParentHandler(regReq2);
    const regData2 = await regRes2.json();
    assert.equal(regRes2.status, 200);
    secondParentToken = await signSession({
      id: regData2.user.id,
      name: regData2.user.name,
      email: regData2.user.email,
      role: "parent",
      schoolId: "sch-gn-01",
      provider: "local",
    });
  });

  after(() => {
    db.resetToDemoData();
  });

  it("1. Authorization: Unauthenticated and unauthorized roles cannot generate or redeem codes", async () => {
    const unauthGen = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST"),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    assert.equal(unauthGen.status, 401);

    const parentGen = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST", parentToken),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    assert.equal(parentGen.status, 403);

    // Teacher 02 only teaches Grade 1, so Grade 4 std-aarav must be 403 Forbidden
    const unauthorizedTeacherGen = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST", teacher02Token),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    assert.equal(unauthorizedTeacherGen.status, 403);

    const unauthRedeem = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", undefined, { code: "PAR-4892" })
    );
    assert.equal(unauthRedeem.status, 401);

    const teacherRedeem = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", teacher01Token, { code: "PAR-4892" })
    );
    assert.equal(teacherRedeem.status, 403);
  });

  it("2. Invalid codes fail without leaking any student information", async () => {
    const res = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", parentToken, {
        code: "PAR-INVALID-999",
      })
    );
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.errorCode, "INVALID_CODE");
    assert.equal(data.student, undefined);
    assert.equal(data.studentId, undefined);
    assert.match(data.error, /Invalid verification code/i);
  });

  it("3. Expired and revoked codes are properly rejected", async () => {
    // Expired code
    const expiredCode = await db.createLinkingCodeAsync("std-aarav", "usr-teacher-01", -1);
    // Force past expiry in store for deterministic test
    const codeObj = await db.getLinkingCodeAsync(expiredCode.code);
    assert.ok(codeObj);
    codeObj.expiresAt = new Date(Date.now() - 60_000).toISOString();
    // Directly test via redeemLinkingCodeAsync/handler: create expired via negative window in store
    const resExpired = await db.redeemLinkingCodeAsync(expiredCode.code, parentUserId, parentProfileId);
    assert.equal(resExpired.success, false);
    assert.equal(resExpired.errorCode, "EXPIRED_CODE");

    // Revoked code
    const genRes = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST", teacher01Token, {
        expiresInDays: 7,
      }),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    const genData = await genRes.json();
    assert.equal(genRes.status, 200);
    const revocableId = genData.linkingCode.id;
    const revocableCode = genData.linkingCode.code;

    const delRes = await revokeLinkCodeHandler(
      makeAuthRequest(
        `http://localhost:3000/api/students/std-aarav/link-code?codeId=${encodeURIComponent(revocableId)}`,
        "DELETE",
        teacher01Token
      ),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    assert.equal(delRes.status, 200);

    const resRevoked = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", parentToken, {
        code: revocableCode,
      })
    );
    const revokedData = await resRevoked.json();
    assert.equal(resRevoked.status, 400);
    assert.equal(revokedData.errorCode, "REVOKED_CODE");
  });

  it("4. Valid teacher-generated code links child (with case/whitespace normalization), persists, and rejects reuse & duplicate linking", async () => {
    // Teacher generates code for Aarav
    const genRes = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST", teacher01Token),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    const genData = await genRes.json();
    assert.equal(genRes.status, 200);
    assert.equal(genData.success, true);
    const code = genData.linkingCode.code;

    // Parent redeems with lowercase + surrounding spaces
    const redeemRes = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", parentToken, {
        code: `  ${code.toLowerCase()}  `,
      })
    );
    const redeemData = await redeemRes.json();
    assert.equal(redeemRes.status, 200);
    assert.equal(redeemData.success, true);
    assert.equal(redeemData.studentId, "std-aarav");
    assert.equal(redeemData.student.displayName, "Aarav Patel");

    // Parent /api/parent/me reflects linked child
    const meRes = await parentMeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/me", "GET", parentToken)
    );
    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.ok(meData.linkedStudents.some((s: any) => s.id === "std-aarav"));

    // Parent can access linked student's records
    const detailRes = await parentStudentHandler(
      makeAuthRequest("http://localhost:3000/api/parent/students/std-aarav", "GET", parentToken),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    assert.equal(detailRes.status, 200);

    // Parent CANNOT access unlinked student's records
    const unlinkedRes = await parentStudentHandler(
      makeAuthRequest("http://localhost:3000/api/parent/students/std-meera", "GET", parentToken),
      { params: Promise.resolve({ id: "std-meera" }) }
    );
    assert.equal(unlinkedRes.status, 403);

    // Second parent trying to reuse already-redeemed code is rejected
    const reuseRes = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", secondParentToken, {
        code,
      })
    );
    const reuseData = await reuseRes.json();
    assert.equal(reuseRes.status, 400);
    assert.equal(reuseData.errorCode, "USED_CODE");
    assert.match(reuseData.error, /already been redeemed/i);

    // Already-linked child: generate a fresh code for Aarav, same parent tries it -> 409 ALREADY_LINKED and code remains active
    const genRes2 = await generateLinkCodeHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "POST", teacher01Token),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    const genData2 = await genRes2.json();
    const freshCode = genData2.linkingCode.code;

    const dupRes = await redeemCodeHandler(
      makeAuthRequest("http://localhost:3000/api/parent/link-code", "POST", parentToken, {
        code: freshCode,
      })
    );
    const dupData = await dupRes.json();
    assert.equal(dupRes.status, 409);
    assert.equal(dupData.errorCode, "ALREADY_LINKED");

    // Verify freshCode was NOT consumed by the duplicate attempt (so another authorized guardian could use it)
    const listRes = await getStudentLinkCodesHandler(
      makeAuthRequest("http://localhost:3000/api/students/std-aarav/link-code", "GET", teacher01Token),
      { params: Promise.resolve({ id: "std-aarav" }) }
    );
    const listData = await listRes.json();
    const matching = listData.linkingCodes.find((c: any) => c.code === freshCode);
    assert.equal(matching.status, "active");
  });
});
