/**
 * StudySaathi AI - Advanced Security & Input Validation Module
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements strict, Unicode-aware alphabetic username validation,
 * RFC 5322 compliant email validation, and comprehensive password policy validation.
 * Zero emojis in code, messages, or logs.
 */

export interface ValidationOutcome<T = string> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validates that a username consists solely of alphabetic letters.
 *
 * Allowed:
 * - ASCII uppercase and lowercase letters (A-Z, a-z)
 * - Unicode alphabetic letters and combining marks for Indian languages
 *   (Devanagari, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Gurmukhi, etc.)
 *
 * Strictly Forbidden:
 * - Numbers (0-9, Unicode numerals)
 * - Special characters, symbols, punctuation (@, #, $, %, _, -, etc.)
 * - Spaces (leading, trailing, or internal)
 * - Emojis
 */
export function validateUsername(rawInput: unknown): ValidationOutcome<string> {
  if (typeof rawInput !== "string") {
    return {
      isValid: false,
      error: "Username must be a valid text string.",
    };
  }

  const raw = rawInput;
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: "Username cannot be empty. Please enter your name using only alphabetic letters.",
    };
  }

  if (raw !== trimmed) {
    return {
      isValid: false,
      error: "Username cannot contain leading or trailing spaces. Please enter only letters without spaces.",
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: "Spaces are not allowed in usernames. Example: 'Raj' or 'Aarav' instead of 'Raj Busa'.",
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Username must be at least 2 characters long.",
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "Username cannot exceed 50 characters in length.",
    };
  }

  // Check for numbers
  if (/\d/.test(trimmed) || /\p{N}/u.test(trimmed)) {
    return {
      isValid: false,
      error: "Numbers are not allowed in usernames. Example: use 'Raj' instead of 'Raj123' or 'Raj007'.",
    };
  }

  // Check for emojis
  if (/\p{Extended_Pictographic}/u.test(trimmed)) {
    return {
      isValid: false,
      error: "Emojis and graphical symbols are not allowed in usernames.",
    };
  }

  // Check for special characters and punctuation
  if (/[\p{P}\p{S}]/u.test(trimmed)) {
    return {
      isValid: false,
      error: "Special characters and symbols are not allowed. Example: use 'Priya' instead of 'Priya@123' or 'Priya_01'.",
    };
  }

  // Strict check: each character must be a Unicode letter (\p{L}) or combining mark (\p{M})
  const pureAlphabeticPattern = /^[\p{Letter}\p{Mark}]+$/u;
  if (!pureAlphabeticPattern.test(trimmed)) {
    return {
      isValid: false,
      error: "Username must contain only alphabetic letters. Numbers, spaces, and symbols are not permitted.",
    };
  }

  return {
    isValid: true,
    data: trimmed,
  };
}

/**
 * Validates and normalizes an email address.
 *
 * Enforces RFC 5322 structure, valid domain syntax, rejects invalid characters,
 * spaces, and malformed domain structures.
 */
export function validateEmail(rawInput: unknown): ValidationOutcome<string> {
  if (typeof rawInput !== "string") {
    return {
      isValid: false,
      error: "Email must be a valid text string.",
    };
  }

  const raw = rawInput;
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: "Email address is required.",
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: "Email address cannot contain spaces.",
    };
  }

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: "Email address cannot exceed 254 characters.",
    };
  }

  // Standard email format checking
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: "Email address must contain exactly one '@' symbol.",
    };
  }

  const [localPart, domainPart] = parts;

  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return {
      isValid: false,
      error: "The username portion of the email address is invalid.",
    };
  }

  if (!domainPart || domainPart.length === 0 || domainPart.length > 253) {
    return {
      isValid: false,
      error: "The domain portion of the email address is invalid.",
    };
  }

  // Disallow double dots
  if (trimmed.includes("..")) {
    return {
      isValid: false,
      error: "Email address cannot contain consecutive dots.",
    };
  }

  // Disallow leading or trailing dot in local part
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return {
      isValid: false,
      error: "The username portion of the email cannot start or end with a dot.",
    };
  }

  // Domain structure checks
  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.startsWith("-") || domainPart.endsWith("-")) {
    return {
      isValid: false,
      error: "The domain name format is invalid.",
    };
  }

  const domainLabels = domainPart.split(".");
  if (domainLabels.length < 2) {
    return {
      isValid: false,
      error: "Email domain must include a valid top-level domain (e.g. .edu.in, .com, .org).",
    };
  }

  const tld = domainLabels[domainLabels.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return {
      isValid: false,
      error: "Email top-level domain must contain at least two letters.",
    };
  }

  // Verify all domain labels
  for (const label of domainLabels) {
    if (!label || label.length > 63 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) {
      return {
        isValid: false,
        error: `Invalid domain segment: '${label}'.`,
      };
    }
  }

  // Full RFC 5322 regex validation
  const rfcEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!rfcEmailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid, properly formatted email address.",
    };
  }

  return {
    isValid: true,
    data: trimmed.toLowerCase(),
  };
}

/**
 * Validates password strength according to educational enterprise security policy.
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character
 */
export function validatePassword(rawInput: unknown): ValidationOutcome<string> & { score: number } {
  if (typeof rawInput !== "string" || !rawInput) {
    return {
      isValid: false,
      score: 0,
      error: "Password is required.",
    };
  }

  const password = rawInput;

  if (password.length < 8) {
    return {
      isValid: false,
      score: 1,
      error: "Password must be at least 8 characters long.",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      score: 1,
      error: "Password cannot exceed 128 characters.",
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) score++;

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      score: Math.min(score, 2),
      error: "Password must contain at least one uppercase letter (A-Z).",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      score: Math.min(score, 2),
      error: "Password must contain at least one lowercase letter (a-z).",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      score: Math.min(score, 2),
      error: "Password must contain at least one digit (0-9).",
    };
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return {
      isValid: false,
      score: Math.min(score, 2),
      error: "Password must contain at least one special character (!@#$%^&*).",
    };
  }

  return {
    isValid: true,
    score,
    data: password,
  };
}
