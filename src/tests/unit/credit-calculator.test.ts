import { describe, it, expect } from "vitest";
import {
  calculateTextModelCreditCost,
  calculateConversationCreditCost,
  calculateTranscriptionTokenCreditCost,
  calculateReplicateImageCreditCost,
} from "@/lib/usage/credit-calculator";
import type {
  TokenUsage,
  RealtimeTokenUsage,
  TranscriptionTokenUsage,
} from "@/lib/usage/types";
import { MODEL_NAMES } from "@/types/models";

describe("Credit Calculator", () => {
  describe("calculateTextModelCreditCost", () => {
    it("should calculate credits for text model usage", () => {
      const tokenUsage: TokenUsage = {
        cachedTokens: 0,
        notCachedTokens: 1000,
        outputTokens: 500,
      };

      const credits = calculateTextModelCreditCost("gpt-4o", tokenUsage);

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should throw error for unknown model", () => {
      const tokenUsage: TokenUsage = {
        notCachedTokens: 1000,
        outputTokens: 500,
      };

      expect(() => {
        calculateTextModelCreditCost("unknown-model", tokenUsage);
      }).toThrow("Token pricing for unknown-model is missing!");
    });

    it("should handle cached tokens with lower cost", () => {
      const cachedUsage: TokenUsage = {
        cachedTokens: 1000,
        notCachedTokens: 0,
        outputTokens: 500,
      };

      const notCachedUsage: TokenUsage = {
        cachedTokens: 0,
        notCachedTokens: 1000,
        outputTokens: 500,
      };

      const cachedCredits = calculateTextModelCreditCost("gpt-4o", cachedUsage);
      const notCachedCredits = calculateTextModelCreditCost(
        "gpt-4o",
        notCachedUsage
      );

      expect(cachedCredits).toBeLessThan(notCachedCredits);
    });
  });


  describe("calculateConversationCreditCost", () => {
    it("should calculate credits for conversation usage", () => {
      const audioUsage: RealtimeTokenUsage = {
        textTokens: {
          cachedTokens: 0,
          notCachedTokens: 768,
        },
        audioTokens: {
          cachedTokens: 0,
          notCachedTokens: 700,
        },
        outputTextTokens: 108,
        outputAudioTokens: 505,
      };

      const credits = calculateConversationCreditCost(
        MODEL_NAMES.OPENAI_REALTIME,
        audioUsage
      );

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should throw error for unknown model", () => {
      const audioUsage: RealtimeTokenUsage = {
        textTokens: { notCachedTokens: 768 },
        audioTokens: { notCachedTokens: 700 },
        outputTextTokens: 108,
        outputAudioTokens: 505,
      };

      expect(() => {
        calculateConversationCreditCost("unknown-model", audioUsage);
      }).toThrow("Realtime conversation pricing for unknown-model is missing!");
    });
  });


  describe("calculateReplicateImageCreditCost", () => {
    it("should calculate replicate image credits correctly", () => {
      // Test with google/imagen-4-fast model (pricing: $0.02 per image)
      // Calculation: $0.02 * 1.5 margin / $0.05 per credit = 0.6 credits
      const result = calculateReplicateImageCreditCost("google/imagen-4-fast", 1);
      expect(result).toBeCloseTo(0.6, 2);
    });

    it("should handle multiple images correctly", () => {
      // Test with 5 images
      // Calculation: $0.02 * 5 images * 1.5 margin / $0.05 per credit = 3.0 credits
      const result = calculateReplicateImageCreditCost("google/imagen-4-fast", 5);
      expect(result).toBeCloseTo(3.0, 2);
    });

    it("should handle zero images", () => {
      const result = calculateReplicateImageCreditCost("google/imagen-4-fast", 0);
      expect(result).toBe(0);
    });

    it("should throw error for unknown replicate model", () => {
      expect(() => {
        calculateReplicateImageCreditCost("unknown-model", 1);
      }).toThrow("Replicate pricing for unknown-model is missing!");
    });

    it("should handle decimal image counts", () => {
      // Test with fractional images (edge case)
      const result = calculateReplicateImageCreditCost("google/imagen-4-fast", 0.5);
      expect(result).toBeCloseTo(0.3, 2); // 0.5 * 0.6
    });

    it("should calculate credits with proper margin and conversion", () => {
      // Verify the full calculation chain:
      // Cost per image: $0.02
      // With 1.5x margin: $0.03
      // At $0.05 per credit: 0.6 credits per image
      const result = calculateReplicateImageCreditCost("google/imagen-4-fast", 10);
      expect(result).toBeCloseTo(6.0, 2); // 10 * 0.6
    });
  });

  describe("calculateTranscriptionTokenCreditCost", () => {
    it("should calculate credits for transcription token usage", () => {
      const tokenUsage: TranscriptionTokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        inputTextTokens: 600,
        inputAudioTokens: 400,
      };

      const credits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        tokenUsage
      );

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should handle zero token usage", () => {
      const tokenUsage: TranscriptionTokenUsage = {
        inputTokens: 0,
        outputTokens: 0,
        inputTextTokens: 0,
        inputAudioTokens: 0,
      };

      const credits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        tokenUsage
      );

      expect(credits).toBe(0);
    });

    it("should calculate higher cost for audio tokens vs text tokens", () => {
      const audioOnlyUsage: TranscriptionTokenUsage = {
        inputTokens: 1000,
        outputTokens: 100,
        inputTextTokens: 0,
        inputAudioTokens: 1000,
      };

      const textOnlyUsage: TranscriptionTokenUsage = {
        inputTokens: 1000,
        outputTokens: 100,
        inputTextTokens: 1000,
        inputAudioTokens: 0,
      };

      const audioCredits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        audioOnlyUsage
      );
      const textCredits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        textOnlyUsage
      );

      expect(audioCredits).toBeGreaterThan(textCredits);
    });

    it("should throw error for unknown model", () => {
      const tokenUsage: TranscriptionTokenUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        inputTextTokens: 600,
        inputAudioTokens: 400,
      };

      expect(() => {
        calculateTranscriptionTokenCreditCost("unknown-model", tokenUsage);
      }).toThrow("Transcription pricing for unknown-model is missing!");
    });

    it("should scale proportionally with token count", () => {
      const smallUsage: TranscriptionTokenUsage = {
        inputTokens: 500,
        outputTokens: 250,
        inputTextTokens: 300,
        inputAudioTokens: 200,
      };

      const largeUsage: TranscriptionTokenUsage = {
        inputTokens: 2000,
        outputTokens: 1000,
        inputTextTokens: 1200,
        inputAudioTokens: 800,
      };

      const smallCredits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        smallUsage
      );
      const largeCredits = calculateTranscriptionTokenCreditCost(
        MODEL_NAMES.OPENAI_TRANSCRIBE,
        largeUsage
      );

      // Large usage should be 4x the cost (2000/500 = 4)
      expect(largeCredits).toBeCloseTo(smallCredits * 4, 5);
    });
  });
});
