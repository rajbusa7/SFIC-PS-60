import type {
  ISimplificationProvider,
  ITranslationProvider,
  ISpeechToTextProvider,
  IAssistantProvider,
  SimplificationOptions,
  TranslationOptions,
  TranscriptionOptions,
  AssistantContext,
} from "./interfaces";
import type {
  SimplificationResult,
  TranslationResult,
  TranscriptionResult,
  AiProviderName,
} from "@/lib/types";
import { sanitizePrompt, extractJsonFromMarkdown } from "../aiProvider";

const TIMEOUT_MS = 25000;

export class GeminiProvider
  implements
    ISimplificationProvider,
    ITranslationProvider,
    ISpeechToTextProvider,
    IAssistantProvider
{
  name: AiProviderName = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY?.trim() || "";
    this.model = model || process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  private async callGenerate(payload: any): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Gemini API key is not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Gemini API HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) msg += `: ${parsed.error.message}`;
      } catch {
        msg += `: ${errText.slice(0, 160)}`;
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response returned from Gemini.");
    return text;
  }

  async simplify(text: string, options: SimplificationOptions): Promise<SimplificationResult> {
    const startTime = Date.now();
    const cleanText = sanitizePrompt(text);

    const levelGuidance = {
      very_simple:
        "Grade 1-3 reading level. Short, crystal-clear sentences (5-8 words). Everyday conversational words. No jargon.",
      simple:
        "Grade 4-6 reading level. Friendly, warm tone. Explain any technical term in parentheses. Maximum 12 words per sentence.",
      standard:
        "Clean, polite, professional school notice. Removes bureaucratic passive voice while preserving polite formality.",
    }[options.readingLevel];

    const systemInstruction = `You are a senior educational communicator for Gujarat primary schools.
Rewrite the provided school notice to make it easily understandable for parents.
CRITICAL RULES:
1. PRESERVE ALL FACTS: Do not alter names, dates, times, deadlines, fees, room numbers, or requirements.
2. PRESERVE INTENT: Never turn a negative prohibition (e.g. 'Do not bring toys') into a positive permission.
3. PRESERVE WARNINGS: Do not remove consequences or safety advisories.
4. TARGET READING LEVEL: ${levelGuidance}
5. OUTPUT FORMAT: Respond ONLY with valid JSON matching:
{
  "simplifiedText": "the rewritten message",
  "keyChangesSummary": "brief explanation of what was simplified",
  "preservationCheckPassed": true,
  "preservationWarning": ""
}`;

    const prompt = `Please simplify this school notice for parents at reading level "${options.readingLevel}":\n\n"${cleanText}"`;

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    };

    const raw = await this.callGenerate(payload);
    const parsed = extractJsonFromMarkdown<{
      simplifiedText?: string;
      keyChangesSummary?: string;
      preservationCheckPassed?: boolean;
      preservationWarning?: string;
    }>(raw);

    const latencyMs = Date.now() - startTime;

    return {
      simplifiedText: parsed?.simplifiedText || raw.trim(),
      originalText: text,
      readingLevel: options.readingLevel,
      keyChangesSummary: parsed?.keyChangesSummary || "Simplified vocabulary and structure for enhanced clarity.",
      preservationCheckPassed: parsed?.preservationCheckPassed ?? true,
      preservationWarning: parsed?.preservationWarning || undefined,
      provider: "gemini",
      modelUsed: this.model,
      latencyMs,
      isAiGenerated: true,
    };
  }

  async translate(text: string, options: TranslationOptions): Promise<TranslationResult> {
    const startTime = Date.now();
    const cleanText = sanitizePrompt(text);

    const langNames: Record<string, string> = {
      en: "English",
      gu: "Gujarati (ગુજરાતી)",
      hi: "Hindi (हिन्दी)",
      mr: "Marathi (मराठी)",
    };

    const targetName = langNames[options.targetLanguage] || options.targetLanguage;
    const sourceName = options.sourceLanguage ? langNames[options.sourceLanguage] || options.sourceLanguage : "Auto-detect";

    const systemInstruction = `You are an expert multilingual translator for Indian school systems.
Translate the school announcement accurately from ${sourceName} into ${targetName}.
RULES:
1. Translate naturally using authentic ${targetName} script (Gujarati: ગુજરાતી, Hindi: हिन्दी).
2. DO NOT alter proper nouns, student names, school names, dates, times, rupee amounts, or phone numbers.
3. Keep instructions respectful, warm, and precise.
4. Output JSON ONLY:
{
  "translatedText": "the translation",
  "detectedSourceLanguage": "en/gu/hi",
  "preservedEntities": ["dates", "names", "numbers preserved"]
}`;

    const prompt = `Translate this school message into ${targetName}:\n\n"${cleanText}"`;

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
      },
    };

    const raw = await this.callGenerate(payload);
    const parsed = extractJsonFromMarkdown<{
      translatedText?: string;
      detectedSourceLanguage?: string;
      preservedEntities?: string[];
    }>(raw);

    const latencyMs = Date.now() - startTime;

    return {
      translatedText: parsed?.translatedText || raw.trim(),
      sourceLanguage: options.sourceLanguage || parsed?.detectedSourceLanguage || "auto",
      targetLanguage: options.targetLanguage,
      detectedSourceLanguage: parsed?.detectedSourceLanguage,
      preservedEntities: parsed?.preservedEntities || [],
      provider: "gemini",
      modelUsed: this.model,
      latencyMs,
      isAiGenerated: true,
    };
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const base64Audio = audioBuffer.toString("base64");

    const prompt = `Transcribe the spoken audio message accurately into text.
The speaker is recording a school notice or teacher announcement in ${options?.language || "Gujarati, Hindi, or English"}.
Provide verbatim transcription without adding extra commentary.
Output JSON ONLY:
{
  "transcript": "transcribed text",
  "detectedLanguage": "gu/hi/en",
  "confidence": 0.95
}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: mimeType || "audio/webm", data: base64Audio } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    };

    const raw = await this.callGenerate(payload);
    const parsed = extractJsonFromMarkdown<{
      transcript?: string;
      detectedLanguage?: string;
      confidence?: number;
    }>(raw);

    const latencyMs = Date.now() - startTime;

    return {
      transcript: parsed?.transcript || raw.trim(),
      detectedLanguage: parsed?.detectedLanguage,
      confidence: parsed?.confidence ?? 0.92,
      provider: "gemini",
      modelUsed: this.model,
      latencyMs,
      isAiGenerated: true,
    };
  }

  async ask(query: string, context: AssistantContext) {
    const startTime = Date.now();
    const cleanQuery = sanitizePrompt(query);

    const noticesSummary = context.notices
      .slice(0, 15)
      .map(
        (n, i) =>
          `[Notice ${i + 1} | ID: ${n.id} | Date: ${n.createdAt.slice(0, 10)} | Title: ${n.title}]\n${n.simplifiedContent || n.originalContent}`
      )
      .join("\n\n---\n\n");

    const systemInstruction = `You are StudySaathi AI School Notice Assistant for parents and teachers.
Answer questions based ONLY on the provided verified school notices.
RULES:
1. FACTUAL GROUNDING: Rely exclusively on the notices provided. Never invent dates, fees, dress codes, or school policies.
2. MISSING DATA: If the notices do not contain the answer, say honestly: "This information is not mentioned in recent school notices. Please contact the class teacher or school office directly."
3. CITE SOURCES: If you find the answer, mention which notice it came from.
4. TONE: Warm, helpful, clear, and reassuring.
Output JSON ONLY:
{
  "answer": "helpful response",
  "citedNoticeIds": ["notice-id-1"],
  "confidence": "high/medium/low"
}`;

    const prompt = `Available School Notices:\n${noticesSummary}\n\nParent/Teacher Question: "${cleanQuery}"`;

    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    };

    const raw = await this.callGenerate(payload);
    const parsed = extractJsonFromMarkdown<{
      answer?: string;
      citedNoticeIds?: string[];
      confidence?: "high" | "medium" | "low";
    }>(raw);

    const latencyMs = Date.now() - startTime;

    return {
      answer: parsed?.answer || raw.trim(),
      citedNoticeIds: parsed?.citedNoticeIds || [],
      confidence: parsed?.confidence || "high",
      provider: "gemini" as AiProviderName,
      modelUsed: this.model,
      latencyMs,
    };
  }
}
