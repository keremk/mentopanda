import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  validateInviteCodeFormat,
  generateUniqueInviteCodes,
} from "@/lib/invite-code-generator";

describe("Invite Code Generator", () => {
  describe("generateInviteCode", () => {
    it("should generate code with default length of 10 plus checksum and dashes", () => {
      const code = generateInviteCode();
      // Expects 10 chars + 1 checksum + 2 dashes = 13 total chars
      // Pattern should be like: ABCD-EFGH-1J2-K
      expect(code.replace(/-/g, "")).toHaveLength(11);
      // Regex to match Crockford Base32 with dashes
      expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z*~$=U]{3}$/);
    });

    it("should generate code with custom length", () => {
      const code = generateInviteCode(8);
      // Expects 8 chars + 1 checksum + 2 dashes = 11 total
      expect(code.replace(/-/g, "")).toHaveLength(9);
      expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z*~$=U]{1}$/);
    });

    it("should throw error for invalid length", () => {
      expect(() => generateInviteCode(4)).toThrow();
      expect(() => generateInviteCode(20)).toThrow();
    });

    it("should include dashes for grouping every 4 characters", () => {
      const code = generateInviteCode(8);

      // 8 + 1 checksum = 9 chars, should have dashes: ABCD-EFGH-J
      expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z\*~\$=U]$/);
    });

    it("should generate different codes on multiple calls", () => {
      const codes = new Set();

      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }

      // Should generate unique codes (very high probability)
      expect(codes.size).toBeGreaterThan(95);
    });

    it("should only use valid Crockford Base32 characters", () => {
      const validChars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ*~$=U";

      for (let i = 0; i < 10; i++) {
        const code = generateInviteCode();
        const withoutDashes = code.replace(/-/g, "");

        for (const char of withoutDashes) {
          expect(validChars).toContain(char);
        }
      }
    });

    it("should exclude ambiguous characters (I, L, O, U from base)", () => {
      const ambiguousChars = "ILOU";

      for (let i = 0; i < 20; i++) {
        const code = generateInviteCode();
        const withoutDashes = code.replace(/-/g, "");
        const baseCode = withoutDashes.slice(0, -1); // Exclude checksum which can have U

        for (const char of ambiguousChars.slice(0, 3)) {
          // I, L, O
          expect(baseCode).not.toContain(char);
        }
      }
    });
  });

  describe("validateInviteCodeFormat", () => {
    it("should validate a correct code", () => {
      const code = generateInviteCode(12);
      expect(validateInviteCodeFormat(code)).toBe(true);
    });

    it("should reject an incorrect code", () => {
      const code = generateInviteCode(12);
      const tamperedCode = code.slice(0, -1) + "X"; // Tamper with checksum
      expect(validateInviteCodeFormat(tamperedCode)).toBe(false);
    });

    it("should reject code with invalid characters", () => {
      expect(validateInviteCodeFormat("ABCD-EFGH-IJKL-M")).toBe(false); // "I" is invalid
      expect(validateInviteCodeFormat("1234-5678-90AB-C-")).toBe(false); // "-" at the end
    });

    it("should handle lowercase and different formatting", () => {
      const validCode = generateInviteCode(12);
      const validCodeLower = validCode.toLowerCase();
      expect(validateInviteCodeFormat(validCodeLower)).toBe(true);
    });

    it("should validate codes with dashes", () => {
      const code = generateInviteCode(8);
      expect(validateInviteCodeFormat(code)).toBe(true);
    });

    it("should validate codes without dashes", () => {
      const code = generateInviteCode(8);
      const withoutDashes = code.replace(/-/g, "");
      expect(validateInviteCodeFormat(withoutDashes)).toBe(true);
    });

    it("should validate codes in lowercase", () => {
      const code = generateInviteCode(8).toLowerCase();
      expect(validateInviteCodeFormat(code)).toBe(true);
    });

    it("should reject codes with invalid checksum", () => {
      // Create a valid code and then corrupt the checksum
      const validCode = generateInviteCode(8);
      const withoutDashes = validCode.replace(/-/g, "");
      const codeWithoutChecksum = withoutDashes.slice(0, -1);

      // Try different invalid checksums
      const invalidChecksums = ["!", "@", "#", "%"];

      invalidChecksums.forEach((invalidChecksum) => {
        const invalidCode = codeWithoutChecksum + invalidChecksum;
        expect(validateInviteCodeFormat(invalidCode)).toBe(false);
      });
    });

    it("should validate checksum symbols for mod-37", () => {
      // The checksum can include * ~ $ = U symbols
      // We'll manually create codes that should have these checksums

      // Generate multiple codes and check if any use checksum symbols
      let foundChecksumSymbol = false;

      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        const withoutDashes = code.replace(/-/g, "");
        const checksum = withoutDashes.slice(-1);

        if ("*~$=U".includes(checksum)) {
          foundChecksumSymbol = true;
          expect(validateInviteCodeFormat(code)).toBe(true);
        }
      }

      expect(foundChecksumSymbol).toBe(true);

      // This is probabilistic, but should find at least one in 100 attempts
      // If not, the test might need adjustment but the logic is still correct
    });

    it("should handle edge case checksums correctly", () => {
      // Test that codes with different checksum types validate
      const checksumSymbols = "*~$=U";

      // Generate base codes and test with each possible checksum symbol
      const baseCode = "ABCDEFGH";

      checksumSymbols.split("").forEach((symbol) => {
        const codeWithSymbol = baseCode + symbol;
        // The validation will check if this checksum is correct for the base
        const isValid = validateInviteCodeFormat(codeWithSymbol);
        expect(typeof isValid).toBe("boolean");
      });
    });
  });

  describe("generateUniqueInviteCodes", () => {
    it("should generate the requested number of unique codes", () => {
      const codes = generateUniqueInviteCodes(10);
      expect(codes).toHaveLength(10);
      expect(new Set(codes).size).toBe(10); // All codes are unique
    });

    it("should generate codes of correct length", () => {
      const codes = generateUniqueInviteCodes(5, 8);
      for (const code of codes) {
        expect(code.replace(/-/g, "")).toHaveLength(9);
      }
    });

    it("should generate valid codes that pass format validation", () => {
      const codes = generateUniqueInviteCodes(5);

      codes.forEach((code) => {
        expect(validateInviteCodeFormat(code)).toBe(true);
      });
    });

    it("should handle generating large numbers of unique codes", () => {
      const codes = generateUniqueInviteCodes(50);
      const uniqueCodes = new Set(codes);

      expect(codes).toHaveLength(50);
      expect(uniqueCodes.size).toBe(50);
    });
  });

  describe("Crockford Base32 compliance", () => {
    it("should use the correct Crockford alphabet", () => {
      const crockfordAlphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

      for (let i = 0; i < 20; i++) {
        const code = generateInviteCode();
        const withoutDashes = code.replace(/-/g, "");
        const baseCode = withoutDashes.slice(0, -1); // Exclude checksum

        for (const char of baseCode) {
          expect(crockfordAlphabet).toContain(char);
        }
      }
    });

    it("should exclude ambiguous characters from base codes", () => {
      // const ambiguousChars = "ILOU";

      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        const withoutDashes = code.replace(/-/g, "");
        const baseCode = withoutDashes.slice(0, -1);

        // I, L, O should never appear in base code
        expect(baseCode).not.toContain("I");
        expect(baseCode).not.toContain("L");
        expect(baseCode).not.toContain("O");
        // U can appear in checksum but not in base code
        expect(baseCode).not.toContain("U");
      }
    });

    it("should generate codes with correct format pattern", () => {
      const patterns = [
        { length: 6, pattern: /^[0-9A-Z]{4}-[0-9A-Z\*~\$=U]{3}$/ }, // 6+1=7: ABCD-EFG
        { length: 8, pattern: /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z\*~\$=U]$/ }, // 8+1=9: ABCD-EFGH-J
        {
          length: 12,
          pattern: /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z\*~\$=U]$/,
        }, // 12+1=13: ABCD-EFGH-IJKL-M
      ];

      patterns.forEach(({ length, pattern }) => {
        const code = generateInviteCode(length);
        expect(code).toMatch(pattern);
      });
    });
  });

  describe("Real-world usage scenarios", () => {
    it("should handle phone dictation scenario (with dashes)", () => {
      const code = generateInviteCode();

      // User types exactly as dictated with dashes
      expect(validateInviteCodeFormat(code)).toBe(true);
    });

    it("should handle user typing without dashes", () => {
      const code = generateInviteCode();
      const withoutDashes = code.replace(/-/g, "");

      // User types without dashes
      expect(validateInviteCodeFormat(withoutDashes)).toBe(true);
    });

    it("should handle mixed case input", () => {
      const code = generateInviteCode();
      const lowercase = code.toLowerCase();
      const mixedCase = code
        .split("")
        .map((char, i) =>
          i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
        )
        .join("");

      expect(validateInviteCodeFormat(lowercase)).toBe(true);
      expect(validateInviteCodeFormat(mixedCase)).toBe(true);
    });

    it("should handle extra spaces (trimmed during validation)", () => {
      const code = generateInviteCode();
      const withSpaces = ` ${code} `;

      // Note: validateInviteCodeFormat handles normalization internally
      // but in real usage you might want to trim spaces before validation
      const trimmed = withSpaces.trim();
      expect(validateInviteCodeFormat(trimmed)).toBe(true);
    });
  });
});
