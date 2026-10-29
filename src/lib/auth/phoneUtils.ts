/**
 * StudySaathi AI - Indian & International Phone Number Normalization
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements strict E.164 normalization for Indian (+91) and international mobile numbers.
 * Validates Telecom Regulatory Authority of India (TRAI) 10-digit mobile standards.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  national: string;
  countryCode: string;
  error?: string;
}

/**
 * Normalizes any user-entered phone number into a standard E.164 string (+919876543210).
 * Handles Indian local formats, spaces, dashes, leading zeroes, and international prefixes.
 */
export function normalizePhoneNumber(
  rawPhone: string,
  defaultCountryCode = "+91"
): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== "string") {
    return {
      isValid: false,
      e164: "",
      national: "",
      countryCode: "",
      error: "Mobile number is required.",
    };
  }

  // Strip all whitespace, parentheses, dashes, and periods
  let cleaned = rawPhone.trim().replace(/[\s\(\)\-\.]/g, "");

  // Convert 00 prefix to +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Handle leading 0 for Indian 11-digit local format (e.g. 09876543210 -> 9876543210)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Case 1: Begins with + (E.164 format)
  if (cleaned.startsWith("+")) {
    if (cleaned.startsWith("+91")) {
      const national = cleaned.slice(3);
      if (/^[6-9]\d{9}$/.test(national)) {
        return {
          isValid: true,
          e164: `+91${national}`,
          national,
          countryCode: "+91",
        };
      }
      return {
        isValid: false,
        e164: cleaned,
        national,
        countryCode: "+91",
        error: "Invalid Indian mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9.",
      };
    }

    // Generic international E.164 format
    if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      return {
        isValid: true,
        e164: cleaned,
        national: cleaned.slice(cleaned.length - 10),
        countryCode: cleaned.slice(0, cleaned.length - 10),
      };
    }

    return {
      isValid: false,
      e164: cleaned,
      national: "",
      countryCode: "",
      error: "Invalid international phone format.",
    };
  }

  // Case 2: Standard 10-digit Indian mobile number (e.g. 9876543210)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      isValid: true,
      e164: `+91${cleaned}`,
      national: cleaned,
      countryCode: "+91",
    };
  }

  // Case 3: 12-digit Indian number without + (e.g. 919876543210)
  if (cleaned.startsWith("91") && cleaned.length === 12 && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    const national = cleaned.slice(2);
    return {
      isValid: true,
      e164: `+91${national}`,
      national,
      countryCode: "+91",
    };
  }

  return {
    isValid: false,
    e164: "",
    national: "",
    countryCode: defaultCountryCode,
    error: "Please enter a valid 10-digit mobile number (e.g. 98765 43210).",
  };
}

/**
 * Masks a phone number for privacy display (e.g. +91 98*** **210).
 */
export function maskPhoneNumber(e164: string): string {
  if (!e164 || e164.length < 8) return e164 || "";
  const visibleStart = e164.slice(0, e164.length - 7);
  const visibleEnd = e164.slice(e164.length - 3);
  return `${visibleStart}****${visibleEnd}`;
}
