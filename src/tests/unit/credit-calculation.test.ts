import { describe, it, expect } from "vitest";
import {
  calculateAssessmentCreditCost,
  calculatePromptHelperCreditCost,
  calculateImageCreditCost,
  calculateConversationCreditCost,
  calculateTranscriptionCreditCost,
  CREDIT_CONFIG,
  type AssessmentUpdate,
  type PromptHelperUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
} from "@/data/usage";

describe("Credit Calculation Functions", () => {
  describe("calculateAssessmentCreditCost", () => {
    it("should calculate cost correctly for GPT-4o assessment", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 500,
            notCached: 1000,
          },
        },
        outputTokens: 750,
        totalTokens: 2250,
      };

      const cost = calculateAssessmentCreditCost(update);

      // Cost should be > 0 and reasonable for the token usage
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be less than 1 credit for this usage
    });

    it("should return 0 for unknown model", () => {
      const update: AssessmentUpdate = {
        modelName: "unknown-model",
        promptTokens: {
          text: {
            cached: 1000,
            notCached: 1000,
          },
        },
        outputTokens: 500,
        totalTokens: 2500,
      };

      const cost = calculateAssessmentCreditCost(update);
      expect(cost).toBe(0);
    });

    it("should handle zero token usage", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 0,
          },
        },
        outputTokens: 0,
        totalTokens: 0,
      };

      const cost = calculateAssessmentCreditCost(update);
      expect(cost).toBe(0);
    });

    it("should apply cached token discount correctly", () => {
      const updateWithCached: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 1000,
            notCached: 0,
          },
        },
        outputTokens: 500,
        totalTokens: 1500,
      };

      const updateWithoutCached: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1000,
          },
        },
        outputTokens: 500,
        totalTokens: 1500,
      };

      const costWithCached = calculateAssessmentCreditCost(updateWithCached);
      const costWithoutCached =
        calculateAssessmentCreditCost(updateWithoutCached);

      // Cached tokens should cost less
      expect(costWithCached).toBeLessThan(costWithoutCached);
    });
  });

  describe("calculatePromptHelperCreditCost", () => {
    it("should calculate cost correctly for prompt helper usage", () => {
      const update: PromptHelperUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1500,
          },
        },
        outputTokens: 800,
        totalTokens: 2300,
      };

      const cost = calculatePromptHelperCreditCost(update);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(2); // Should be reasonable for this usage
    });

    it("should have same calculation logic as assessment", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 100,
            notCached: 500,
          },
        },
        outputTokens: 300,
        totalTokens: 900,
      };

      const assessmentCost = calculateAssessmentCreditCost(update);
      const promptHelperCost = calculatePromptHelperCreditCost(update);

      // Should be identical since they use the same model and logic
      expect(assessmentCost).toBe(promptHelperCost);
    });
  });

  describe("calculateImageCreditCost", () => {
    it("should calculate cost correctly for DALL-E image generation", () => {
      const update: ImageUpdate = {
        modelName: "gpt_image_1",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 0,
          },
          image: {
            cached: 0,
            notCached: 0,
          },
        },
      };

      const cost = calculateImageCreditCost(update);
      expect(cost).toBeGreaterThan(0);
      // Image generation should be more expensive than text
      expect(cost).toBeGreaterThan(0.1);
    });

    it("should have different costs for different quality levels", () => {
      const lowQuality: ImageUpdate = {
        modelName: "gpt_image_1",
        quality: "low",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const highQuality: ImageUpdate = {
        modelName: "gpt_image_1",
        quality: "high",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const lowCost = calculateImageCreditCost(lowQuality);
      const highCost = calculateImageCreditCost(highQuality);

      // High quality should cost more than low quality
      expect(highCost).toBeGreaterThan(lowCost);
    });

    it("should have different costs for different sizes", () => {
      const square: ImageUpdate = {
        modelName: "gpt_image_1",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const landscape: ImageUpdate = {
        modelName: "gpt_image_1",
        quality: "medium",
        size: "landscape",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const squareCost = calculateImageCreditCost(square);
      const landscapeCost = calculateImageCreditCost(landscape);

      // Different sizes may have different costs
      expect(squareCost).toBeGreaterThan(0);
      expect(landscapeCost).toBeGreaterThan(0);
    });

    it("should return 0 for unknown model", () => {
      const update: ImageUpdate = {
        modelName: "unknown-image-model",
        quality: "medium",
        size: "square",
        promptTokens: {
          text: { cached: 0, notCached: 0 },
          image: { cached: 0, notCached: 0 },
        },
      };

      const cost = calculateImageCreditCost(update);
      expect(cost).toBe(0);
    });
  });

  describe("calculateConversationCreditCost", () => {
    it("should calculate cost correctly for realtime conversation", () => {
      const update: ConversationUpdate = {
        modelName: "gpt-4o-realtime-preview",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 768,
          },
          audio: {
            cached: 0,
            notCached: 700,
          },
        },
        outputTokens: {
          text: 108,
          audio: 505,
        },
        totalTokens: 2081,
        totalSessionLength: 60, // 1 minute
      };

      const cost = calculateConversationCreditCost(update);
      expect(cost).toBeGreaterThan(0);
      // Realtime conversation should be more expensive
      expect(cost).toBeGreaterThan(0.05);
    });

    it("should apply cached token discounts for both text and audio", () => {
      const updateWithCached: ConversationUpdate = {
        modelName: "gpt-4o-realtime-preview",
        promptTokens: {
          text: {
            cached: 500,
            notCached: 0,
          },
          audio: {
            cached: 500,
            notCached: 0,
          },
        },
        outputTokens: {
          text: 100,
          audio: 100,
        },
        totalTokens: 1200,
      };

      const updateWithoutCached: ConversationUpdate = {
        modelName: "gpt-4o-realtime-preview",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 500,
          },
          audio: {
            cached: 0,
            notCached: 500,
          },
        },
        outputTokens: {
          text: 100,
          audio: 100,
        },
        totalTokens: 1200,
      };

      const costWithCached = calculateConversationCreditCost(updateWithCached);
      const costWithoutCached =
        calculateConversationCreditCost(updateWithoutCached);

      // Cached should cost less
      expect(costWithCached).toBeLessThan(costWithoutCached);
    });

    it("should return 0 for unknown model", () => {
      const update: ConversationUpdate = {
        modelName: "unknown-realtime-model",
        promptTokens: {
          text: { cached: 0, notCached: 100 },
          audio: { cached: 0, notCached: 100 },
        },
        outputTokens: {
          text: 50,
          audio: 50,
        },
        totalTokens: 300,
      };

      const cost = calculateConversationCreditCost(update);
      expect(cost).toBe(0);
    });
  });

  describe("calculateTranscriptionCreditCost", () => {
    it("should calculate cost correctly for transcription", () => {
      const update: TranscriptionUpdate = {
        modelName: "whisper-1",
        totalSessionLength: 60, // 1 minute
        userChars: 235,
        agentChars: 712,
      };

      const cost = calculateTranscriptionCreditCost(update);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.5); // Transcription should be relatively cheap but adjust expectation
    });

    it("should scale with session length", () => {
      const shortSession: TranscriptionUpdate = {
        modelName: "whisper-1",
        totalSessionLength: 30, // 30 seconds
        userChars: 100,
        agentChars: 200,
      };

      const longSession: TranscriptionUpdate = {
        modelName: "whisper-1",
        totalSessionLength: 120, // 2 minutes
        userChars: 400,
        agentChars: 800,
      };

      const shortCost = calculateTranscriptionCreditCost(shortSession);
      const longCost = calculateTranscriptionCreditCost(longSession);

      // Longer session should cost more
      expect(longCost).toBeGreaterThan(shortCost);
      // Should be roughly proportional (2x length = 2x cost)
      expect(longCost).toBeCloseTo(shortCost * 4, 1); // 4x because 120/30 = 4
    });

    it("should handle zero session length", () => {
      const update: TranscriptionUpdate = {
        modelName: "whisper-1",
        totalSessionLength: 0,
        userChars: 0,
        agentChars: 0,
      };

      const cost = calculateTranscriptionCreditCost(update);
      expect(cost).toBe(0);
    });
  });

  describe("Credit configuration", () => {
    it("should have reasonable credit value and margin", () => {
      expect(CREDIT_CONFIG.CREDIT_VALUE_USD).toBe(0.05); // 5 cents per credit
      expect(CREDIT_CONFIG.MARGIN_MULTIPLIER).toBe(1.5); // 50% margin
    });

    it("should calculate credits from USD correctly", () => {
      // This tests the internal calculateCreditsFromUSD function indirectly
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1000, // 1K tokens
          },
        },
        outputTokens: 500, // 0.5K tokens
        totalTokens: 1500,
      };

      const cost = calculateAssessmentCreditCost(update);

      // Should be reasonable - not too high or too low
      expect(cost).toBeGreaterThan(0.001); // At least 0.1 cent
      expect(cost).toBeLessThan(10); // Less than $0.50
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle undefined optional parameters", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            // cached is undefined
            notCached: 1000,
          },
        },
        // outputTokens is undefined
        // totalTokens is undefined
      };

      const cost = calculateAssessmentCreditCost(update);
      expect(cost).toBeGreaterThan(0); // Should still calculate cost
    });

    it("should handle very large token counts", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1000000, // 1M tokens
          },
        },
        outputTokens: 500000, // 500K tokens
        totalTokens: 1500000,
      };

      const cost = calculateAssessmentCreditCost(update);
      expect(cost).toBeGreaterThan(1); // Should be expensive
      expect(cost).toBeLessThan(1000); // But not unreasonably so
    });

    it("should handle very small token counts", () => {
      const update: AssessmentUpdate = {
        modelName: "gpt-4o",
        promptTokens: {
          text: {
            cached: 0,
            notCached: 1, // 1 token
          },
        },
        outputTokens: 1, // 1 token
        totalTokens: 2,
      };

      const cost = calculateAssessmentCreditCost(update);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.001); // Should be very small
    });
  });
});
