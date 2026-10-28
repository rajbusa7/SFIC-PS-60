import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizePrompt,
  extractJsonFromMarkdown,
  generateAiContent,
} from "./aiProvider";
import { calculatePercentage } from "../engine/calculations";
import { detectLearningGap } from "../engine/gapDetection";

describe("StudySaathi AI Provider & Security Directives", () => {
  it("sanitizes prompt to strip PII emails and phone numbers", () => {
    const raw = "Student aarav.patel@gmail.com and parent phone 9876543210 need help with division.";
    const sanitized = sanitizePrompt(raw);
    assert.ok(!sanitized.includes("aarav.patel@gmail.com"), "Should remove email");
    assert.ok(!sanitized.includes("9876543210"), "Should remove phone number");
    assert.ok(sanitized.includes("[EMAIL]"));
    assert.ok(sanitized.includes("[PHONE]"));
  });

  it("limits prompt size to prevent token overflow attacks", () => {
    const hugePrompt = "a".repeat(10000);
    const sanitized = sanitizePrompt(hugePrompt);
    assert.ok(sanitized.length <= 4000, "Should truncate prompt to 4000 characters");
  });

  it("extracts clean JSON even when wrapped in markdown code blocks", () => {
    const wrapped = "Here is the response:\n```json\n{\n  \"topic\": \"Division\",\n  \"steps\": [1, 2, 3]\n}\n```\nHope this helps!";
    const parsed = extractJsonFromMarkdown<{ topic: string; steps: number[] }>(wrapped);
    assert.ok(parsed, "Should parse JSON from markdown fence");
    assert.equal(parsed?.topic, "Division");
    assert.equal(parsed?.steps.length, 3);
  });

  it("falls back to deterministic pedagogical engine when external API keys are not provided", async () => {
    // Ensure keys are undefined for this test
    const origGemini = process.env.GEMINI_API_KEY;
    const origOpenAi = process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const fallbackData = { topic: "Fallback Equal Sharing", questions: [1, 2, 3] };
      const response = await generateAiContent(
        { prompt: "Teach division" },
        () => ({ content: JSON.stringify(fallbackData), data: fallbackData })
      );

      assert.equal(response.success, true);
      assert.equal(response.isAiGenerated, false, "Must honestly declare isAiGenerated = false");
      assert.equal(response.provider, "offline_fallback");
      assert.equal(response.modelUsed, "deterministic_pedagogical_rule_engine");
      assert.ok(response.note?.includes("Offline"), "Note must state offline status");
      assert.deepEqual(response.data, fallbackData);
    } finally {
      process.env.GEMINI_API_KEY = origGemini;
      process.env.OPENAI_API_KEY = origOpenAi;
    }
  });

  it("keeps deterministic calculation scores strictly separate from AI generative outputs", () => {
    const marks = 7;
    const max = 20;
    const calculated = calculatePercentage(marks, max);
    assert.equal(calculated, 35, "Calculation must be deterministic 35%");

    const gap = detectLearningGap("c-div-01", "Division Basics", [
      { marksObtained: marks, maximumMarks: max, recordedAt: "2026-10-18T10:00:00Z" },
    ]);

    assert.equal(gap.masteryStatus, "Needs Support");
    assert.equal(gap.priority, "High");
    assert.equal(gap.latestPercentage, 35);
  });
});
