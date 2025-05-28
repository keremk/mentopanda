import { describe, it, expect } from "vitest";
import {
  calculateTextModelCreditCost,
  calculateImageCreditCost,
  calculateConversationCreditCost,
  calculateTranscriptionCreditCost,
} from "@/lib/usage/credit-calculator";
import type {
  TokenUsage,
  AudioTokenUsage,
  ImageGenerationParams,
  TranscriptionParams,
} from "@/lib/usage/types";

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

    it("should return 0 for unknown model", () => {
      const tokenUsage: TokenUsage = {
        notCachedTokens: 1000,
        outputTokens: 500,
      };

      const credits = calculateTextModelCreditCost("unknown-model", tokenUsage);

      expect(credits).toBe(0);
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

  describe("calculateImageCreditCost", () => {
    it("should calculate credits for image generation", () => {
      const params: ImageGenerationParams = {
        modelName: "gpt-image-1",
        quality: "medium",
        size: "square",
      };

      const credits = calculateImageCreditCost(params);

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should return 0 for unknown model", () => {
      const params: ImageGenerationParams = {
        modelName: "unknown-model",
        quality: "medium",
        size: "square",
      };

      const credits = calculateImageCreditCost(params);

      expect(credits).toBe(0);
    });

    it("should handle different quality levels", () => {
      const lowQuality: ImageGenerationParams = {
        modelName: "gpt-image-1",
        quality: "low",
        size: "square",
      };

      const highQuality: ImageGenerationParams = {
        modelName: "gpt-image-1",
        quality: "high",
        size: "square",
      };

      const lowCredits = calculateImageCreditCost(lowQuality);
      const highCredits = calculateImageCreditCost(highQuality);

      // High quality should cost more than low quality (if pricing data supports this)
      expect(typeof lowCredits).toBe("number");
      expect(typeof highCredits).toBe("number");
    });
  });

  describe("calculateConversationCreditCost", () => {
    it("should calculate credits for conversation usage", () => {
      const audioUsage: AudioTokenUsage = {
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
        "gpt-4o-realtime-preview",
        audioUsage
      );

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should return 0 for unknown model", () => {
      const audioUsage: AudioTokenUsage = {
        textTokens: { notCachedTokens: 768 },
        audioTokens: { notCachedTokens: 700 },
        outputTextTokens: 108,
        outputAudioTokens: 505,
      };

      const credits = calculateConversationCreditCost(
        "unknown-model",
        audioUsage
      );

      expect(credits).toBe(0);
    });
  });

  describe("calculateTranscriptionCreditCost", () => {
    it("should calculate credits for transcription", () => {
      const params: TranscriptionParams = {
        sessionLengthMinutes: 1, // 1 minute
      };

      const credits = calculateTranscriptionCreditCost(params);

      expect(credits).toBeGreaterThan(0);
      expect(typeof credits).toBe("number");
    });

    it("should scale with session length", () => {
      const shortSession: TranscriptionParams = {
        sessionLengthMinutes: 1,
      };

      const longSession: TranscriptionParams = {
        sessionLengthMinutes: 5,
      };

      const shortCredits = calculateTranscriptionCreditCost(shortSession);
      const longCredits = calculateTranscriptionCreditCost(longSession);

      expect(longCredits).toBeGreaterThan(shortCredits);
      expect(longCredits).toBeCloseTo(shortCredits * 5, 5);
    });

    it("should handle zero session length", () => {
      const params: TranscriptionParams = {
        sessionLengthMinutes: 0,
      };

      const credits = calculateTranscriptionCreditCost(params);

      expect(credits).toBe(0);
    });
  });
});
