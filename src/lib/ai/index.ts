/**
 * StudySaathi AI - Centralized AI Integration System
 * Single-source-of-truth for all providers, adapters, routers, security, and services.
 */

// Core Router & Registry
export { aiRouter, AiRouter } from "./router";
export { aiRegistry, ProviderRegistry } from "./registry";
export type { ProviderStatusInfo } from "./registry";

// Security & Secret Management
export { secretManager, SecretManager } from "./security/secret-manager";
export { validateKeyFormat, verifyAdminAccess } from "./security/key-validation";

// High-Level Domain Services
export { chatService, ChatService } from "./services/chat.service";
export { translationService, TranslationService } from "./services/translation.service";
export { simplificationService, SimplificationService } from "./services/simplification.service";
export { schoolAssistantService, SchoolAssistantService } from "./services/school-assistant.service";
export { speechToTextService, SpeechToTextService } from "./services/speech-to-text.service";
export { textToSpeechService, TextToSpeechService } from "./services/text-to-speech.service";

// Middleware
export { authenticateAiRequest, requireAdminRole } from "./middleware/authentication";
export { validateChatMessage, validateProviderSelection, validateTaskType } from "./middleware/validation";
export { checkRateLimit, pruneRateLimitStore } from "./middleware/rate-limit";

// Utilities
export { sanitizePrompt, extractJsonFromMarkdown } from "./utils/sanitizer";
export { withTimeout } from "./utils/timeout";
export { withRetry } from "./utils/retry";
export { recordAiUsage, estimateTokenCount, calculateEstimatedCost } from "./utils/usage-tracker";
export { aiLogger, AiLogger } from "./utils/logging";
export {
  AiError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  ProviderUnavailableError,
  CapabilityNotSupportedError,
  ValidationError,
  sanitizeErrorMessage,
} from "./utils/errors";

// Configurations
export { SUPPORTED_PROVIDERS_METADATA, DEFAULT_AI_CONFIGS } from "./config";

// Types
export * from "./types";
