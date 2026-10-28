import crypto from "crypto";

/**
 * StudySaathi AI - Cryptographic Password Hashing & Verification
 * SFIC Gujarat Hackathon 2026 - Problem Statement PS-60
 *
 * Implements PBKDF2-SHA256 password hashing with random salt and timing-safe comparison.
 * Zero external dependencies, 100% compliant with standard Node.js crypto module.
 */

const SALT_BYTES = 16;
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = "sha256";

/**
 * Hashes a plaintext password using PBKDF2-SHA256 with a unique random salt.
 * Returns formatted string: "salt:hexHash"
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a valid non-empty string.");
  }
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Timing-safe verification of a plaintext password against a stored "salt:hexHash" string.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }
  const [salt, originalHash] = parts;
  try {
    const computedHash = crypto
      .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST)
      .toString("hex");

    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(originalHash, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
