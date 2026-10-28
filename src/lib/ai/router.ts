import { aiRegistry } from "./registry";
import { db } from "@/lib/db/database";
import { DEFAULT_AI_CONFIGS } from "./config";
import { withRetry } from "./utils/retry";
import { recordAiUsage, estimateTokenCount } from "./utils/usage-tracker";
import {
  AiError,
  ValidationError,
  CapabilityNotSupportedError,
  ProviderUnavailableError,
  AuthenticationError,
} from "./utils/errors";
import type {
  AiProviderName,
  AiTaskType,
  AiCapability,
  ChatRequest,
  ChatResponse,
  SimplificationOptions,
  SimplificationResult,
  TranslationOptions,
  TranslationResult,
  TranscriptionOptions,
  TranscriptionResult,
  AudioSynthesisOptions,
  AudioSynthesisResult,
  AssistantContext,
  AssistantResponse,
  AiProviderConfig,
  ConnectionTestResult,
} from "./types";

export interface GenerateTextParams {
  provider?: AiProviderName;
  task?: AiTaskType;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  prompt?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

// In-memory audio synthesis cache
const ttsCache = new Map<string, AudioSynthesisResult>();

export class AiRouter {
  private static instance: AiRouter;

  private constructor() {}

  public static getInstance(): AiRouter {
    if (!AiRouter.instance) {
      AiRouter.instance = new AiRouter();
    }
    return AiRouter.instance;
  }

  /**
   * Retrieves configured primary and fallback providers for a given task
   */
  public async getTaskConfig(task: AiTaskType): Promise<AiProviderConfig> {
    try {
      const configs = db.getAiProviderConfigs();
      const match = configs.find((c) => c.task === task);
      if (match) return match;
    } catch {
      // ignore
    }

    const defaultMatch = DEFAULT_AI_CONFIGS.find((c) => c.task === task);
    return (
      defaultMatch || {
        task,
        primaryProvider: "openai",
        fallbackProvider: "offline_fallback",
        enabled: true,
      }
    );
  }

  /**
   * Resolves a provider adapter and verifies capability support
   */
  private resolveProvider(
    providerName: AiProviderName,
    requiredCapability: AiCapability
  ) {
    const adapter = aiRegistry.get(providerName);
    if (!adapter) {
      throw new ValidationError(`Unknown AI provider '${providerName}'.`);
    }
    if (!adapter.capabilities.includes(requiredCapability)) {
      throw new CapabilityNotSupportedError(requiredCapability, providerName);
    }
    return adapter;
  }

  /**
   * Universal text generation routing (for chat, tutoring, lessons, etc.)
   */
  public async generateText(params: GenerateTextParams): Promise<ChatResponse> {
    const task: AiTaskType = params.task || "chat";
    const config = await this.getTaskConfig(task);

    const envProvider = (process.env.AI_PROVIDER as AiProviderName) || undefined;
    const primaryName = params.provider || envProvider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || (envProvider !== "gemini" ? "gemini" : "offline_fallback");

    const messages = [...params.messages];
    if (params.prompt && (!messages.length || messages[messages.length - 1].content !== params.prompt)) {
      messages.push({ role: "user", content: params.prompt });
    }

    const chatRequest: ChatRequest = {
      messages,
      systemInstruction: params.systemInstruction,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      responseFormat: params.responseFormat,
    };

    const startTime = Date.now();
    let primaryAdapter = this.resolveProvider(primaryName, "chat");

    // If primary is unconfigured and not offline, try fallback if configured
    if (!primaryAdapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "chat");
      if (fallbackAdapter.isConfigured()) {
        primaryAdapter = fallbackAdapter;
      } else {
        const offlineAdapter = this.resolveProvider("offline_fallback", "chat");
        primaryAdapter = offlineAdapter;
      }
    }

    try {
      const result = await withRetry(
        async () => {
          if (!primaryAdapter.chat) {
            throw new CapabilityNotSupportedError("chat", primaryAdapter.id);
          }
          return await primaryAdapter.chat(chatRequest);
        },
        { maxRetries: 1 }
      );

      recordAiUsage({
        task,
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
        tokensPrompt: estimateTokenCount(messages.map((m) => m.content).join(" ")),
        tokensCompletion: estimateTokenCount(result.content),
      });

      return result;
    } catch (err: any) {
      console.warn(`Primary chat provider '${primaryAdapter.id}' failed: ${err.message}.`);

      // Attempt fallback if different provider
      if (fallbackName && fallbackName !== primaryAdapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "chat");
          if (fallbackAdapter.chat && fallbackAdapter.isConfigured()) {
            const fbResult = await fallbackAdapter.chat(chatRequest);
            recordAiUsage({
              task,
              provider: fbResult.provider,
              model: fbResult.modelUsed,
              latencyMs: Date.now() - startTime,
              success: true,
              error: `Fallback triggered from ${primaryAdapter.id}: ${err.message}`,
            });
            return fbResult;
          }
        } catch (fbErr: any) {
          console.warn(`Fallback chat provider '${fallbackName}' also failed: ${fbErr.message}`);
        }
      }

      // If primary was not Gemini and fallback was not Gemini, attempt Gemini as secondary live failover
      if (primaryAdapter.id !== "gemini" && fallbackName !== "gemini") {
        try {
          const geminiAdapter = this.resolveProvider("gemini", "chat");
          if (geminiAdapter.chat && geminiAdapter.isConfigured()) {
            const fbResult = await geminiAdapter.chat(chatRequest);
            recordAiUsage({
              task,
              provider: fbResult.provider,
              model: fbResult.modelUsed,
              latencyMs: Date.now() - startTime,
              success: true,
              error: `Dynamic failover triggered from ${primaryAdapter.id}: ${err.message}`,
            });
            return fbResult;
          }
        } catch (gErr: any) {
          console.warn(`Secondary Gemini failover failed: ${gErr.message}`);
        }
      }

      // If all cloud providers failed or timed out (excluding explicit authentication errors), attempt offline pedagogical engine
      const isAuthError =
        err.message?.includes("401") ||
        err.message?.includes("Incorrect API key") ||
        err.message?.includes("Invalid API key") ||
        err.message?.includes("authentication") ||
        err.name === "AuthenticationError" ||
        (process.env.OPENAI_API_KEY || "").includes("invalid") ||
        (process.env.GEMINI_API_KEY || "").includes("invalid");

      if (!isAuthError && primaryAdapter.id !== "offline_fallback" && fallbackName !== "offline_fallback") {
        try {
          const offlineAdapter = this.resolveProvider("offline_fallback", "chat");
          if (offlineAdapter.chat) {
            const fbResult = await offlineAdapter.chat(chatRequest);
            recordAiUsage({
              task,
              provider: fbResult.provider,
              model: fbResult.modelUsed,
              latencyMs: Date.now() - startTime,
              success: true,
              error: `Local pedagogical fallback triggered after cloud provider failure: ${err.message}`,
            });
            return fbResult;
          }
        } catch (offErr: any) {
          console.warn(`Offline fallback failed: ${offErr.message}`);
        }
      }

      recordAiUsage({
        task,
        provider: primaryAdapter.id,
        model: primaryAdapter.defaultModel,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });

      throw err;
    }
  }

  /**
   * Chat endpoint wrapper
   */
  public async chat(request: ChatRequest & { provider?: AiProviderName }): Promise<ChatResponse> {
    return this.generateText({
      provider: request.provider,
      task: "chat",
      messages: request.messages,
      systemInstruction: request.systemInstruction,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      responseFormat: request.responseFormat,
    });
  }

  /**
   * Multilingual translation router
   */
  public async translate(params: {
    text: string;
    sourceLanguage?: string;
    targetLanguage: string;
    provider?: AiProviderName;
    readingLevel?: any;
    preserveEntities?: boolean;
  }): Promise<TranslationResult> {
    const config = await this.getTaskConfig("translation");
    const primaryName = params.provider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || "offline_fallback";

    const options: TranslationOptions = {
      sourceLanguage: params.sourceLanguage,
      targetLanguage: params.targetLanguage,
      readingLevel: params.readingLevel,
      preserveEntities: params.preserveEntities,
    };

    let adapter = this.resolveProvider(primaryName, "translation");
    if (!adapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "translation");
      if (fallbackAdapter.isConfigured()) {
        adapter = fallbackAdapter;
      } else {
        adapter = this.resolveProvider("offline_fallback", "translation");
      }
    }

    const startTime = Date.now();
    try {
      const result = await withRetry(
        async () => {
          if (!adapter.translate) {
            throw new CapabilityNotSupportedError("translation", adapter.id);
          }
          return await adapter.translate(params.text, options);
        },
        { maxRetries: 1 }
      );

      recordAiUsage({
        task: "translation",
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
        tokensPrompt: estimateTokenCount(params.text),
        tokensCompletion: estimateTokenCount(result.translatedText),
      });

      return result;
    } catch (err: any) {
      console.warn(`Translation provider '${adapter.id}' failed: ${err.message}.`);

      if (fallbackName && fallbackName !== adapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "translation");
          if (fallbackAdapter.translate && fallbackAdapter.isConfigured()) {
            const fbResult = await fallbackAdapter.translate(params.text, options);
            recordAiUsage({
              task: "translation",
              provider: fbResult.provider,
              model: fbResult.modelUsed,
              latencyMs: Date.now() - startTime,
              success: true,
              error: `Fallback triggered: ${err.message}`,
            });
            return fbResult;
          }
        } catch {}
      }

      recordAiUsage({
        task: "translation",
        provider: adapter.id,
        model: adapter.defaultModel,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });

      throw err;
    }
  }

  /**
   * School notice simplification router
   */
  public async simplify(params: {
    text: string;
    readingLevel: any;
    provider?: AiProviderName;
    preserveEntities?: boolean;
  }): Promise<SimplificationResult> {
    const config = await this.getTaskConfig("simplification");
    const primaryName = params.provider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || "offline_fallback";

    const options: SimplificationOptions = {
      readingLevel: params.readingLevel,
      preserveEntities: params.preserveEntities,
    };

    let adapter = this.resolveProvider(primaryName, "simplification");
    if (!adapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "simplification");
      if (fallbackAdapter.isConfigured()) {
        adapter = fallbackAdapter;
      } else {
        adapter = this.resolveProvider("offline_fallback", "simplification");
      }
    }

    const startTime = Date.now();
    try {
      const result = await withRetry(
        async () => {
          if (!adapter.simplify) {
            throw new CapabilityNotSupportedError("simplification", adapter.id);
          }
          return await adapter.simplify(params.text, options);
        },
        { maxRetries: 1 }
      );

      recordAiUsage({
        task: "simplification",
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
        tokensPrompt: estimateTokenCount(params.text),
        tokensCompletion: estimateTokenCount(result.simplifiedText),
      });

      return result;
    } catch (err: any) {
      console.warn(`Simplification provider '${adapter.id}' failed: ${err.message}.`);

      if (fallbackName && fallbackName !== adapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "simplification");
          if (fallbackAdapter.simplify && fallbackAdapter.isConfigured()) {
            const fbResult = await fallbackAdapter.simplify(params.text, options);
            recordAiUsage({
              task: "simplification",
              provider: fbResult.provider,
              model: fbResult.modelUsed,
              latencyMs: Date.now() - startTime,
              success: true,
              error: `Fallback triggered: ${err.message}`,
            });
            return fbResult;
          }
        } catch {}
      }

      recordAiUsage({
        task: "simplification",
        provider: adapter.id,
        model: adapter.defaultModel,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });

      throw err;
    }
  }

  /**
   * Voice-to-text dictation router
   */
  public async transcribe(params: {
    audioBuffer: Buffer;
    mimeType: string;
    options?: TranscriptionOptions;
    provider?: AiProviderName;
  }): Promise<TranscriptionResult> {
    const config = await this.getTaskConfig("speech_to_text");
    const primaryName = params.provider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || "offline_fallback";

    let adapter = this.resolveProvider(primaryName, "speech_to_text");
    if (!adapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "speech_to_text");
      if (fallbackAdapter.isConfigured()) {
        adapter = fallbackAdapter;
      } else {
        adapter = this.resolveProvider("offline_fallback", "speech_to_text");
      }
    }

    const startTime = Date.now();

    try {
      const result = await withRetry(
        async () => {
          if (!adapter.transcribe) {
            throw new CapabilityNotSupportedError("speech_to_text", adapter.id);
          }
          return await adapter.transcribe(params.audioBuffer, params.mimeType, params.options);
        },
        { maxRetries: 1 }
      );

      recordAiUsage({
        task: "speech_to_text",
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
      });

      return result;
    } catch (err: any) {
      if (fallbackName && fallbackName !== adapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "speech_to_text");
          if (fallbackAdapter.transcribe && fallbackAdapter.isConfigured()) {
            return await fallbackAdapter.transcribe(params.audioBuffer, params.mimeType, params.options);
          }
        } catch {}
      }

      recordAiUsage({
        task: "speech_to_text",
        provider: adapter.id,
        model: adapter.defaultModel,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Text-to-speech audio synthesis router with caching
   */
  public async synthesize(params: {
    text: string;
    options: AudioSynthesisOptions;
    provider?: AiProviderName;
  }): Promise<AudioSynthesisResult> {
    const cacheKey = `${params.options.language}:${params.options.voice || "default"}:${params.text.trim()}`;
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    const config = await this.getTaskConfig("text_to_speech");
    const primaryName = params.provider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || "offline_fallback";

    let adapter = this.resolveProvider(primaryName, "text_to_speech");
    if (!adapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "text_to_speech");
      if (fallbackAdapter.isConfigured()) {
        adapter = fallbackAdapter;
      } else {
        adapter = this.resolveProvider("offline_fallback", "text_to_speech");
      }
    }

    const startTime = Date.now();

    try {
      const result = await withRetry(
        async () => {
          if (!adapter.synthesize) {
            throw new CapabilityNotSupportedError("text_to_speech", adapter.id);
          }
          return await adapter.synthesize(params.text, params.options);
        },
        { maxRetries: 1 }
      );

      ttsCache.set(cacheKey, result);

      recordAiUsage({
        task: "text_to_speech",
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
      });

      return result;
    } catch (err: any) {
      if (fallbackName && fallbackName !== adapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "text_to_speech");
          if (fallbackAdapter.synthesize && fallbackAdapter.isConfigured()) {
            const fbResult = await fallbackAdapter.synthesize(params.text, params.options);
            ttsCache.set(cacheKey, fbResult);
            return fbResult;
          }
        } catch {}
      }

      recordAiUsage({
        task: "text_to_speech",
        provider: adapter.id,
        model: adapter.defaultModel,
        latencyMs: Date.now() - startTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Notice assistant Q&A router
   */
  public async askNoticeAssistant(params: {
    query: string;
    context: AssistantContext;
    provider?: AiProviderName;
  }): Promise<AssistantResponse> {
    const config = await this.getTaskConfig("assistant");
    const primaryName = params.provider || config.primaryProvider;
    const fallbackName = config.fallbackProvider || "offline_fallback";

    let adapter = this.resolveProvider(primaryName, "assistant");
    if (!adapter.isConfigured() && primaryName !== "offline_fallback") {
      const fallbackAdapter = this.resolveProvider(fallbackName, "assistant");
      if (fallbackAdapter.isConfigured()) {
        adapter = fallbackAdapter;
      } else {
        adapter = this.resolveProvider("offline_fallback", "assistant");
      }
    }

    const startTime = Date.now();
    try {
      const result = await withRetry(
        async () => {
          if (!adapter.askAssistant) {
            throw new CapabilityNotSupportedError("assistant", adapter.id);
          }
          return await adapter.askAssistant(params.query, params.context);
        },
        { maxRetries: 1 }
      );

      recordAiUsage({
        task: "assistant",
        provider: result.provider,
        model: result.modelUsed,
        latencyMs: result.latencyMs,
        success: true,
      });

      return result;
    } catch (err: any) {
      if (fallbackName && fallbackName !== adapter.id) {
        try {
          const fallbackAdapter = this.resolveProvider(fallbackName, "assistant");
          if (fallbackAdapter.askAssistant && fallbackAdapter.isConfigured()) {
            return await fallbackAdapter.askAssistant(params.query, params.context);
          }
        } catch {}
      }
      throw err;
    }
  }

  /**
   * Connection test dispatch
   */
  public async testProviderConnection(providerName: AiProviderName): Promise<ConnectionTestResult> {
    return aiRegistry.testConnection(providerName);
  }
}

export const aiRouter = AiRouter.getInstance();
