/**
 * Crockford Base32 Invite Code Generator
 *
 * Uses Crockford Base32 encoding with:
 * - 32 symbols: 0123456789ABCDEFGHJKMNPQRSTVWXYZ (excludes I, L, O, U)
 * - Checksum using mod-37 with symbols: *~$=U
 * - Grouping with dashes every 4 characters
 */

import { randomBytes } from "crypto";

// Crockford Base32 alphabet (32 characters)
const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Checksum symbols for mod-37 (5 additional characters)
const CHECKSUM_SYMBOLS = "*~$=U";

/**
 * Generate a random Crockford Base32 string
 */
function generateRandomBase32(length: number): string {
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomValue =
      typeof window !== "undefined" && globalThis.crypto
        ? globalThis.crypto.getRandomValues(new Uint8Array(1))[0]
        : randomBytes(1)[0];
    result += CROCKFORD_ALPHABET[randomValue % 32];
  }

  return result;
}

/**
 * Calculate Crockford mod-37 checksum
 */
function calculateChecksum(code: string): string {
  let sum = 0;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const value = CROCKFORD_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in code: ${char}`);
    }
    sum += value;
  }

  const checksumIndex = sum % 37;

  // First 32 values use the main alphabet, remaining 5 use checksum symbols
  if (checksumIndex < 32) {
    return CROCKFORD_ALPHABET[checksumIndex];
  } else {
    return CHECKSUM_SYMBOLS[checksumIndex - 32];
  }
}

/**
 * Add dash grouping every 4 characters
 */
function addGrouping(code: string): string {
  return code.match(/.{1,4}/g)?.join("-") || code;
}

/**
 * Validate a Crockford Base32 code with checksum
 * Expects the code to be in the dashed format (e.g., "ABCD-EFGH-1J2K-M")
 */
export function validateInviteCodeFormat(code: string): boolean {
  // Remove dashes for validation
  const normalized = code.replace(/-/g, "").toUpperCase();

  if (normalized.length < 2) {
    return false;
  }

  // Split code and checksum
  const codeWithoutChecksum = normalized.slice(0, -1);
  const providedChecksum = normalized.slice(-1);

  // Validate all characters are in the valid alphabet
  for (const char of codeWithoutChecksum) {
    if (!CROCKFORD_ALPHABET.includes(char)) {
      return false;
    }
  }

  // Validate checksum character
  if (
    !CROCKFORD_ALPHABET.includes(providedChecksum) &&
    !CHECKSUM_SYMBOLS.includes(providedChecksum)
  ) {
    return false;
  }

  // Calculate and verify checksum
  try {
    const calculatedChecksum = calculateChecksum(codeWithoutChecksum);
    return calculatedChecksum === providedChecksum;
  } catch {
    return false;
  }
}

/**
 * Generate a Crockford Base32 invite code with checksum and grouping
 *
 * @param length - Length of the base code (8-12 recommended, default 10)
 * @returns Formatted invite code with checksum and dashes (e.g., "ABCD-EFGH-1J2K-M")
 */
export function generateInviteCode(length: number = 10): string {
  // Ensure length is within reasonable bounds
  if (length < 6 || length > 16) {
    throw new Error("Invite code length must be between 6 and 16 characters");
  }

  // Generate random base code
  const baseCode = generateRandomBase32(length);

  // Calculate and append checksum
  const checksum = calculateChecksum(baseCode);
  const codeWithChecksum = baseCode + checksum;

  // Add dash grouping
  return addGrouping(codeWithChecksum);
}

/**
 * Generate multiple unique invite codes
 */
export function generateUniqueInviteCodes(
  count: number,
  length: number = 10
): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    codes.add(generateInviteCode(length));
  }

  return Array.from(codes);
}
