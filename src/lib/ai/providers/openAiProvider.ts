import type {
  ISimplificationProvider,
  ITranslationProvider,
  ISpeechToTextProvider,
  ITextToSpeechProvider,
  IAssistantProvider,
  SimplificationOptions,
  TranslationOptions,
  TranscriptionOptions,
  AudioSynthesisOptions,
  AssistantContext,
} from "./interfaces";
import type {
  SimplificationResult,
  TranslationResult,
  TranscriptionResult,
  AudioSynthesisResult,
  AiProviderName,
} from "@/lib/types";
import { sanitizePrompt, extractJsonFromMarkdown } from "../aiProvider";

const TIMEOUT_MS = 25000;

export class OpenAiProvider
  implements
    ISimplificationProvider,
    ITranslationProvider,
    ISpeechToTextProvider,
    ITextToSpeechProvider,
    IAssistantProvider
{
  name: AiProviderName = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY?.trim() || "";
    this.model = model || process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    this.baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  private async callChat(messages: any[], responseJson = true): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured.");
    }

    const payload: any = {
      model: this.model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
    };

    if (responseJson) {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API HTTP ${response.status}: ${errText.slice(0, 160)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response returned from OpenAI.");
    return text;
  }

  async simplify(text: string, options: SimplificationOptions): Promise<SimplificationResult> {
    const startTime = Date.now();
    const cleanText = sanitizePrompt(text);

    const systemInstruction = `You are an educational communication assistant for Gujarat primary schools.
Rewrite the provided school notice into easily understandable language for parents.
Target Reading Level: ${options.readingLevel}.
CRITICAL RULES:
1. Preserve all names, dates, times, deadlines, fees, room numbers, and requirements.
2. Never invent policies or remove consequence warnings.
3. Output valid JSON ONLY matching:
{
  "simplifiedText": "rewritten text",
  "keyChangesSummary": "explanation of edits",
  "preservationCheckPassed": true,
  "preservationWarning": ""
}`;

    const messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: `Simplify this school notice:\n\n"${cleanText}"` },
    ];

    const raw = await this.callChat(messages, true);
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
      keyChangesSummary: parsed?.keyChangesSummary || "Simplified vocabulary and sentence length.",
      preservationCheckPassed: parsed?.preservationCheckPassed ?? true,
      preservationWarning: parsed?.preservationWarning || undefined,
      provider: "openai",
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
    };
    const targetName = langNames[options.targetLanguage] || options.targetLanguage;

    const systemInstruction = `You are an expert multilingual school translator.
Translate the school announcement accurately into ${targetName}.
Preserve student names, dates, rupee amounts, and school identifiers.
Output valid JSON ONLY:
{
  "translatedText": "translated content",
  "detectedSourceLanguage": "en/gu/hi",
  "preservedEntities": ["dates", "names"]
}`;

    const messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: `Translate into ${targetName}:\n\n"${cleanText}"` },
    ];

    const raw = await this.callChat(messages, true);
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
      provider: "openai",
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
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured for Whisper STT.");
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType || "audio/webm" });
    formData.append("file", blob, "recording.webm");
    formData.append("model", "whisper-1");
    if (options?.language) {
      formData.append("language", options.language);
    }
    if (options?.prompt) {
      formData.append("prompt", options.prompt);
    }

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI Whisper API HTTP ${response.status}: ${errText.slice(0, 160)}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      transcript: data.text || "",
      detectedLanguage: options?.language,
      confidence: 0.95,
      provider: "openai",
      modelUsed: "whisper-1",
      latencyMs,
      isAiGenerated: true,
    };
  }

  async synthesize(text: string, options: AudioSynthesisOptions): Promise<AudioSynthesisResult> {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured for TTS.");
    }

    const voice = options.voice || "alloy";
    const payload = {
      model: "tts-1",
      input: text.slice(0, 1000),
      voice,
      response_format: "mp3",
    };

    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI TTS HTTP ${response.status}: ${errText.slice(0, 160)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const latencyMs = Date.now() - startTime;

    return {
      audioBase64: base64Audio,
      mimeType: "audio/mp3",
      provider: "openai",
      modelUsed: "tts-1",
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

    const systemInstruction = `You are StudySaathi AI School Notice Assistant.
Answer parent/teacher questions using ONLY the provided verified notices.
If information is not present, state clearly that it is unavailable in recent notices.
Output valid JSON ONLY:
{
  "answer": "helpful response",
  "citedNoticeIds": ["notice-id-1"],
  "confidence": "high/medium/low"
}`;

    const messages = [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Available Notices:\n${noticesSummary}\n\nQuestion: "${cleanQuery}"`,
      },
    ];

    const raw = await this.callChat(messages, true);
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
      provider: "openai" as AiProviderName,
      modelUsed: this.model,
      latencyMs,
    };
  }
}
