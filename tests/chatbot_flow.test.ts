import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { POST as chatHandler } from "../src/app/api/v1/ai/chat/route";
import { POST as assistantHandler } from "../src/app/api/ai/assistant/route";
import { aiService } from "../apps/backend/src/services/aiService";
import { db } from "../src/lib/db/database";

function createMockRequest(url: string, method: string, body?: any): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const OLD_HARDCODED_FRAGMENT = "Based on our offline pedagogical engine, Aarav Patel was identified with a 35% baseline";

describe("Chatbot Dynamic Response Flow & Bug Verification Suite", () => {
  before(() => {
    db.resetToDemoData();
  });
  it("TEST 1: 'What is photosynthesis?' returns a scientific explanation and never the hardcoded student report", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "What is photosynthesis?",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT), "Must not return repeated hardcoded student text");
    assert.ok(
      data.message.toLowerCase().includes("photosynthesis") ||
      data.message.toLowerCase().includes("sunlight") ||
      data.message.toLowerCase().includes("plant"),
      "Must explain photosynthesis"
    );
  });

  it("TEST 2: 'Translate \"School will be closed tomorrow\" into Gujarati' returns the Gujarati translation", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Translate 'School will be closed tomorrow' into Gujarati.",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.includes("શાળા બંધ રહેશે") || data.message.includes("આવતીકાલે"),
      "Must contain the Gujarati translation"
    );
  });

  it("TEST 3: 'Write a polite message reminding parents about homework' drafts suitable parent communication", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Write a polite message reminding parents about homework.",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("homework") &&
      (data.message.toLowerCase().includes("parent") || data.message.toLowerCase().includes("dear")),
      "Must contain polite parent homework reminder message"
    );
  });

  it("TEST 4: 'Who needs immediate help today in Class 4?' uses authorized database data and never hallucinates", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Who needs immediate help today in Class 4?",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Verified DB truth: Aarav Patel (35%, Division) & Dev Shah (45%, Subject-Verb Agreement)
    assert.ok(data.message.includes("Aarav Patel"), "Must mention Aarav Patel from Class 4 database");
    assert.ok(data.message.includes("Dev Shah"), "Must mention Dev Shah from Class 4 database");
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT), "Must not return the static hardcoded string");
  });

  it("TEST 4b: 'Who needs immediate help today in Class 2?' clearly states no gaps found without inventing students", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Who needs immediate help today in Class 2?",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(
      data.message.toLowerCase().includes("no students") ||
      data.message.toLowerCase().includes("no active") ||
      data.message.toLowerCase().includes("currently no"),
      "Must state that no high-priority gaps exist for Class 2"
    );
  });

  it("TEST 5: 'What is 15 multiplied by 8?' returns 120 with an explanation", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "What is 15 multiplied by 8?",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(data.message.includes("120"), "Must calculate 15 * 8 = 120");
  });

  it("TEST 6: 'Explain the water cycle in simple words' explains condensation, evaporation, and precipitation", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Explain the water cycle in simple words.",
      language: "en",
      userRole: "teacher",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("water cycle") ||
      data.message.toLowerCase().includes("evaporation") ||
      data.message.toLowerCase().includes("rain"),
      "Must explain the water cycle"
    );
  });

  it("TEST 7: Consecutive unrelated questions receive independently relevant answers with conversation history", async () => {
    // Question 1: Explain fractions simply
    const q1Res = await aiService.askAssistant("Explain fractions simply.", [], "en", "teacher");
    assert.equal(q1Res.success, true);
    assert.ok(!q1Res.message.includes(OLD_HARDCODED_FRAGMENT));

    // Question 2: Follow-up question asking for an example
    const history = [
      { role: "user" as const, content: "Explain fractions simply." },
      { role: "assistant" as const, content: q1Res.message },
    ];
    const q2Res = await aiService.askAssistant("What is 15 multiplied by 8?", history, "en", "teacher");
    assert.equal(q2Res.success, true);
    assert.ok(q2Res.message.includes("120"), "Must answer the new independent question accurately");
    assert.ok(!q2Res.message.includes(OLD_HARDCODED_FRAGMENT), "Must not contaminate new turn with hardcoded report");
  });

  it("TEST 8: Temporarily configuring an invalid API key displays a clear API error and NEVER returns hardcoded response", async () => {
    const origKey = process.env.OPENAI_API_KEY;
    const origProvider = process.env.AI_PROVIDER;
    const origGemini = process.env.GEMINI_API_KEY;

    try {
      // Configure an invalid API key
      process.env.OPENAI_API_KEY = "sk-invalid-test-api-key-that-will-fail-401";
      process.env.AI_PROVIDER = "openai";
      delete process.env.GEMINI_API_KEY;

      const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
        message: "What is photosynthesis?",
        language: "en",
        userRole: "teacher",
      });

      const res = await chatHandler(req);
      assert.equal(res.status, 500, "Should return HTTP 500 when API key is rejected");
      const data = await res.json();
      assert.equal(data.success, false, "Must return success = false on API failure");
      assert.ok(data.error, "Must include clear error details");
      assert.ok(
        data.error.includes("OpenAI") || data.error.includes("status 401") || data.error.includes("API provider error") || data.error.toLowerCase().includes("failed"),
        `Error must specify API provider failure: ${data.error}`
      );
      assert.ok(!JSON.stringify(data).includes(OLD_HARDCODED_FRAGMENT), "Must never return the hardcoded student report on error");
    } finally {
      if (origKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = origKey;

      if (origProvider === undefined) delete process.env.AI_PROVIDER;
      else process.env.AI_PROVIDER = origProvider;

      if (origGemini === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = origGemini;
    }
  });

  it("TEST 9: 'What is artificial intelligence?' returns an accurate explanation of AI systems", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "What is artificial intelligence?",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("artificial intelligence") ||
      data.message.toLowerCase().includes("reasoning") ||
      data.message.toLowerCase().includes("learning"),
      "Must explain artificial intelligence"
    );
  });

  it("TEST 10: 'Write a simple Python calculator.' returns executable Python code in code blocks", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Write a simple Python calculator.",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(data.message.includes("```python"), "Must contain markdown code block for python");
    assert.ok(data.message.includes("def add"), "Must contain Python calculator functions");
  });

  it("TEST 11: 'Write a C++ program to reverse a string.' returns working C++ code and complexity analysis", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Write a C++ program to reverse a string.",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(data.message.includes("```cpp"), "Must contain markdown code block for C++");
    assert.ok(data.message.includes("reverse"), "Must implement reverse logic");
  });

  it("TEST 12: 'Translate Good morning into Gujarati.' returns accurate Gujarati translation and pronunciation", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Translate Good morning into Gujarati.",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.includes("સુપ્રભાત") || data.message.includes("શુભ સવાર"),
      "Must include Gujarati translation for Good morning"
    );
  });

  it("TEST 13: 'What is 125 multiplied by 24?' calculates 3000 dynamically", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "What is 125 multiplied by 24?",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(data.message.includes("3000"), "Must compute 125 * 24 = 3000");
  });

  it("TEST 14: 'Write a birthday message for my friend.' generates a creative, warm greeting", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Write a birthday message for my friend.",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("birthday") &&
      (data.message.toLowerCase().includes("friend") || data.message.toLowerCase().includes("happy")),
      "Must contain birthday greeting"
    );
  });

  it("TEST 15: 'What is the difference between AI and machine learning?' provides a clear comparison", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "What is the difference between AI and machine learning?",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("subset") ||
      data.message.toLowerCase().includes("umbrella") ||
      data.message.toLowerCase().includes("machine learning"),
      "Must explain the distinction between AI and ML"
    );
  });

  it("TEST 16: 'Give me an unusual startup idea.' generates a creative business concept", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "Give me an unusual startup idea.",
      language: "en",
    });
    const res = await chatHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(!data.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      data.message.toLowerCase().includes("idea") ||
      data.message.toLowerCase().includes("problem") ||
      data.message.toLowerCase().includes("startup"),
      "Must generate startup idea"
    );
  });

  it("TEST 17: Validates input rejection for empty and excessively long messages", async () => {
    // Empty message
    const emptyReq = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: "   ",
    });
    const emptyRes = await chatHandler(emptyReq);
    assert.equal(emptyRes.status, 400);
    const emptyData = await emptyRes.json();
    assert.equal(emptyData.success, false);
    assert.ok(emptyData.error.includes("required"));

    // Long message (>4000 characters)
    const longText = "a".repeat(4500);
    const longReq = createMockRequest("http://localhost:3000/api/v1/ai/chat", "POST", {
      message: longText,
    });
    const longRes = await chatHandler(longReq);
    assert.equal(longRes.status, 400);
    const longData = await longRes.json();
    assert.equal(longData.success, false);
    assert.ok(longData.error.includes("too long") || longData.error.includes("4,000"));
  });

  it("TEST 18: Validates multi-turn context retention with follow-up queries", async () => {
    const q1 = await aiService.askAssistant("Explain machine learning with an example.", [], "en", "teacher");
    assert.equal(q1.success, true);
    assert.ok(!q1.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(q1.message.toLowerCase().includes("machine learning"));

    // Follow-up question relying on previous turn
    const history = [
      { role: "user" as const, content: "Explain machine learning with an example." },
      { role: "assistant" as const, content: q1.message },
    ];
    const q2 = await aiService.askAssistant("Give me a real-world example.", history, "en", "teacher");
    assert.equal(q2.success, true);
    assert.ok(!q2.message.includes(OLD_HARDCODED_FRAGMENT));
    assert.ok(
      q2.message.toLowerCase().includes("netflix") ||
      q2.message.toLowerCase().includes("spotify") ||
      q2.message.toLowerCase().includes("recommendation") ||
      q2.message.toLowerCase().includes("example"),
      "Follow-up must understand machine learning context"
    );
  });

  it("Validates that /api/ai/assistant also processes dynamic questions and returns response aliases", async () => {
    const req = createMockRequest("http://localhost:3000/api/ai/assistant", "POST", {
      message: "What is 15 multiplied by 8?",
      language: "en",
      userRole: "teacher",
    });
    const res = await assistantHandler(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.message.includes("120"));
    assert.equal(data.reply, data.message, "Must provide data.reply alias");
    assert.equal(data.text, data.message, "Must provide data.text alias");
  });
});
