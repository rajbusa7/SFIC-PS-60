/**
 * StudySaathi AI - Server-Side AI Provider Facade
 * Delegates to centralized AI router in src/lib/ai/router.ts.
 */
import { aiRouter } from "./router";
import { sanitizePrompt, extractJsonFromMarkdown } from "./utils/sanitizer";
import { secretManager } from "./security/secret-manager";
import type { AiProviderName } from "./types";

export { sanitizePrompt, extractJsonFromMarkdown };

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiRequestOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  messages?: AiChatMessage[];
}

export interface AiResponse<T = any> {
  success: boolean;
  content: string;
  data?: T;
  isAiGenerated: boolean;
  provider: "gemini" | "openai" | "anthropic" | "offline_fallback";
  modelUsed: string;
  note?: string;
  error?: string;
}

/**
 * Primary dispatch function: attempts Live AI call with configured keys via aiRouter,
 * or gracefully returns fallback to indicate offline pedagogical rules are active.
 */
export async function generateAiContent<T = any>(
  options: AiRequestOptions,
  fallbackGenerator?: () => { content: string; data?: T }
): Promise<AiResponse<T>> {
  const geminiKey = secretManager.getSecret("GEMINI_API_KEY");
  const openAiKey = secretManager.getSecret("OPENAI_API_KEY");
  const anthropicKey = secretManager.getSecret("ANTHROPIC_API_KEY");

  // Retrieve configured primary provider from task config or env override
  let preferred = (process.env.AI_PROVIDER || "").toLowerCase().trim();
  if (!preferred) {
    try {
      const taskConfig = await aiRouter.getTaskConfig("chat");
      preferred = taskConfig.primaryProvider;
    } catch {
      preferred = openAiKey ? "openai" : geminiKey ? "gemini" : "offline_fallback";
    }
  }

  let chosenProvider: AiProviderName = "offline_fallback";
  if (preferred === "offline_fallback") {
    chosenProvider = "offline_fallback";
  } else if (preferred === "openai" && openAiKey) {
    chosenProvider = "openai";
  } else if (preferred === "gemini" && geminiKey) {
    chosenProvider = "gemini";
  } else if (preferred === "anthropic" && anthropicKey) {
    chosenProvider = "anthropic";
  } else if (openAiKey) {
    chosenProvider = "openai";
  } else if (geminiKey) {
    chosenProvider = "gemini";
  } else {
    chosenProvider = "offline_fallback";
  }

  // If no external keys and fallback generator supplied, execute honest offline fallback
  if (chosenProvider === "offline_fallback") {
    if (fallbackGenerator) {
      const fb = fallbackGenerator();
      return {
        success: true,
        content: fb.content,
        data: fb.data,
        isAiGenerated: false,
        provider: "offline_fallback",
        modelUsed: "deterministic_pedagogical_rule_engine",
        note: "Offline Pedagogical Fallback Active: No external AI key is configured. Using built-in Gujarat primary curriculum templates.",
      };
    }

    return {
      success: false,
      content: "",
      isAiGenerated: false,
      provider: "openai",
      modelUsed: "none",
      error:
        "Missing API Key: OPENAI_API_KEY is not configured in your server environment (.env). Please set OPENAI_API_KEY in your .env file to enable live AI responses.",
    };
  }

  try {
    const formattedMessages = (options.messages || []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    if (!formattedMessages.length || formattedMessages[formattedMessages.length - 1].content !== options.prompt) {
      formattedMessages.push({ role: "user", content: options.prompt });
    }

    const res = await aiRouter.generateText({
      provider: chosenProvider,
      task: "chat",
      messages: formattedMessages,
      systemInstruction: options.systemInstruction,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      responseFormat: options.responseFormat,
    });

    const parsedData =
      options.responseFormat === "json" ? extractJsonFromMarkdown<T>(res.content) : undefined;

    return {
      success: true,
      content: res.content,
      data: parsedData ?? undefined,
      isAiGenerated: res.isAiGenerated,
      provider: res.provider as any,
      modelUsed: res.modelUsed,
      note: res.note || `Generated live using ${res.provider} (${res.modelUsed}).`,
    };
  } catch (err: any) {
    console.error(`${chosenProvider} API call failed:`, err.message);

    // If fallback generator provided and no external keys configured, execute fallback
    if (fallbackGenerator && !openAiKey && !geminiKey && !anthropicKey) {
      const fb = fallbackGenerator();
      return {
        success: true,
        content: fb.content,
        data: fb.data,
        isAiGenerated: false,
        provider: "offline_fallback",
        modelUsed: "deterministic_pedagogical_rule_engine",
        note: `Offline Pedagogical Fallback Active: ${err.message}`,
      };
    }

    return {
      success: false,
      content: "",
      isAiGenerated: false,
      provider: chosenProvider as any,
      modelUsed: "error",
      error: `AI provider error (${chosenProvider}): ${err.message}`,
    };
  }
}
