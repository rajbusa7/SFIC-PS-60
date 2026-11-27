import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_LANGUAGES,
  SCHEDULED_INDIAN_LANGUAGES,
  LANGUAGE_REGISTRY,
  searchLanguages,
  resolveEffectiveScript,
  getDirection,
} from "../src/lib/i18n/registry";
import {
  englishDictionary,
  loadLocaleDictionary,
  createDeepTranslationProxy,
  resolveTranslationPath,
  getMissingKeyLog,
  clearMissingKeyLog,
} from "../src/lib/i18n/loader";
import {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDate,
  interpolateTemplate,
  selectPluralForm,
} from "../src/lib/i18n/formatters";
import { generateTranslationCoverageReport } from "../src/lib/i18n/coverage";
import { EDUCATIONAL_GLOSSARY, buildGlossaryInstruction } from "../src/lib/i18n/glossary";
import { GET as getPreferencesRoute, PATCH as patchPreferencesRoute } from "../src/app/api/user/preferences/route";
import { GET as getCoverageRoute } from "../src/app/api/i18n/coverage/route";
import { signSession, SESSION_COOKIE_NAME } from "../src/lib/auth/session";
import { db } from "../src/lib/db/database";

describe("Phase 1: Complete Indian Multilingual Infrastructure", () => {
  it("1. Registers all 22 Eighth Schedule Indian languages plus English with script variants", () => {
    assert.equal(SCHEDULED_INDIAN_LANGUAGES.length, 22);
    assert.equal(ALL_LANGUAGES.length, 23);

    const expectedCodes = [
      "as", "bn", "brx", "doi", "gu", "hi", "kn", "ks", "kok", "mai",
      "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur",
    ];
    for (const code of expectedCodes) {
      assert.ok(code in LANGUAGE_REGISTRY, `Missing scheduled language: ${code}`);
    }

    // Multi-script checks
    assert.equal(LANGUAGE_REGISTRY.ks.scriptVariants.length, 2);
    assert.equal(LANGUAGE_REGISTRY.mni.scriptVariants.length, 2);
    assert.equal(LANGUAGE_REGISTRY.sd.scriptVariants.length, 2);
    assert.equal(LANGUAGE_REGISTRY.pa.scriptVariants.length, 2);
    assert.equal(LANGUAGE_REGISTRY.sat.scriptVariants.length, 2);

    // Direction checks
    assert.equal(getDirection("ur", "Arab"), "rtl");
    assert.equal(getDirection("ks", "Arab"), "rtl");
    assert.equal(getDirection("ks", "Deva"), "ltr");
    assert.equal(getDirection("sd", "Arab"), "rtl");
    assert.equal(getDirection("sd", "Deva"), "ltr");
    assert.equal(getDirection("pa", "Guru"), "ltr");
    assert.equal(getDirection("pa", "Arab"), "rtl");
  });

  it("2. Search helper finds languages by English name, native name, region, script, and ISO code", () => {
    assert.ok(searchLanguages("हिन्दी").some((l) => l.code === "hi"));
    assert.ok(searchLanguages("Meetei").some((l) => l.code === "mni"));
    assert.ok(searchLanguages("Shahmukhi").some((l) => l.code === "pa"));
    assert.ok(searchLanguages("Ol Chiki").some((l) => l.code === "sat"));
    assert.ok(searchLanguages("South").length >= 4);
  });

  it("3. Dynamically loads Gujarati namespace bundle asynchronously and detects missing/empty keys cleanly", async () => {
    clearMissingKeyLog();
    const guDict = await loadLocaleDictionary("gu");
    assert.equal(guDict.nav.dashboard, "ડેશબોર્ડ");

    // Verify empty string never masks English fallback
    const partialDict = {
      nav: {
        dashboard: "हिन्दी डैशबोर्ड",
        students: "",
      },
    };
    const proxy = createDeepTranslationProxy(partialDict, englishDictionary, "hi");
    assert.equal(proxy.nav.dashboard, "हिन्दी डैशबोर्ड");
    assert.equal(proxy.nav.students, englishDictionary.nav.students);
    assert.equal(proxy.learningGaps.title, englishDictionary.learningGaps.title);

    const missing = getMissingKeyLog();
    assert.ok(missing.some((m) => m.lang === "hi" && m.key === "nav.students"));
    assert.ok(missing.some((m) => m.lang === "hi" && m.key.startsWith("learningGaps")));
  });

  it("4. Formats numbers, percentages, INR currency, dates, plural forms, and templates", () => {
    assert.equal(
      interpolateTemplate("Class {{grade}} has {count} students", { grade: 4, count: 19 }),
      "Class 4 has 19 students"
    );
    const inrEn = formatCurrency(1500, "en", "Latn");
    assert.ok(inrEn.includes("1,500"));

    const guPct = formatPercent(85, "gu", "Gujr");
    assert.ok(guPct.length > 0);

    const formattedDate = formatDate("2026-11-26T00:00:00Z", "en", "Latn");
    assert.ok(formattedDate.includes("2026"));

    const p0 = selectPluralForm(0, { zero: "No gaps", one: "{count} gap", other: "{count} gaps" }, "en");
    const p1 = selectPluralForm(1, { zero: "No gaps", one: "{count} gap", other: "{count} gaps" }, "en");
    const p5 = selectPluralForm(5, { zero: "No gaps", one: "{count} gap", other: "{count} gaps" }, "en");
    assert.equal(p0, "No gaps");
    assert.equal(p1, "1 gap");
    assert.equal(p5, "5 gaps");
  });

  it("5. Computes honest real translation coverage without inflating unimplemented languages", () => {
    const report = generateTranslationCoverageReport();
    assert.ok(report.totalCanonicalKeys > 200);

    const en = report.languages.find((l) => l.code === "en")!;
    const gu = report.languages.find((l) => l.code === "gu")!;
    const ta = report.languages.find((l) => l.code === "ta")!;

    assert.equal(en.completionPercent, 100);
    assert.equal(en.missingKeysCount, 0);
    assert.equal(gu.completionPercent, 100);
    assert.equal(gu.missingKeysCount, 0);
    assert.equal(gu.reviewedPercent, 100);
    assert.equal(ta.completionPercent, 0);
    assert.equal(ta.missingKeysCount, report.totalCanonicalKeys);

    // Glossary entries exist for core terms
    assert.ok("learningGap" in EDUCATIONAL_GLOSSARY);
    assert.ok(buildGlossaryInstruction("hi").includes("सीखने की कमी"));
  });

  it("6. Persists per-user language & script preferences independently and protects coverage endpoint", async () => {
    // Unauthenticated preferences rejected
    const unauthRes = await getPreferencesRoute(new Request("http://localhost:3000/api/user/preferences"));
    assert.equal(unauthRes.status, 401);

    // Sign tokens for two independent users (Teacher & Parent)
    const teacherToken = await signSession({
      id: "usr-teacher-01",
      name: "Pooja Sharma",
      email: "teacher@studysaathi.edu.in",
      role: "teacher",
      schoolId: "sch-gn-01",
      provider: "local",
    });
    const parentToken = await signSession({
      id: "par-001",
      name: "Dineshbhai Patel",
      email: "dinesh.patel@example.com",
      role: "parent",
      schoolId: "sch-gn-01",
      provider: "local",
    });

    // Reject invalid language or invalid script variant
    const badLangRes = await patchPreferencesRoute(
      new Request("http://localhost:3000/api/user/preferences", {
        method: "PATCH",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredLanguage: "xx" }),
      })
    );
    assert.equal(badLangRes.status, 400);

    const badScriptRes = await patchPreferencesRoute(
      new Request("http://localhost:3000/api/user/preferences", {
        method: "PATCH",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredLanguage: "hi", preferredScript: "Arab" }),
      })
    );
    assert.equal(badScriptRes.status, 400);

    // Teacher selects Kashmiri (Devanagari), Parent selects Gujarati
    const tSave = await patchPreferencesRoute(
      new Request("http://localhost:3000/api/user/preferences", {
        method: "PATCH",
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${teacherToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferredLanguage: "ks", preferredScript: "Deva" }),
      })
    );
    assert.equal(tSave.status, 200);
    const tData = await tSave.json();
    assert.equal(tData.preferences.preferredLanguage, "ks");
    assert.equal(tData.preferences.preferredScript, "Deva");

    // Verify GET restores teacher preference
    const tGet = await getPreferencesRoute(
      new Request("http://localhost:3000/api/user/preferences", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${teacherToken}` },
      })
    );
    const tGetData = await tGet.json();
    assert.equal(tGetData.preferences.preferredLanguage, "ks");
    assert.equal(tGetData.preferences.preferredScript, "Deva");

    // Coverage endpoint forbids parents (403) and allows teachers (200)
    const covParent = await getCoverageRoute(
      new Request("http://localhost:3000/api/i18n/coverage", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${parentToken}` },
      })
    );
    assert.equal(covParent.status, 403);

    const covTeacher = await getCoverageRoute(
      new Request("http://localhost:3000/api/i18n/coverage", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${teacherToken}` },
      })
    );
    assert.equal(covTeacher.status, 200);
    const covData = await covTeacher.json();
    assert.equal(covData.success, true);
    assert.equal(covData.report.languages.length, 23);

    // Restore teacher baseline preference cleanly
    await db.updateUserAsync("usr-teacher-01", { preferredLanguage: "en", preferredScript: "Latn" });
  });
});
