import { describe, it, expect } from "vitest";
import {
  deductCreditsWithPriority,
  calculateRolloverCredits,
  initializePeriodCredits,
  calculateCreditBalance,
  checkSufficientCredits,
} from "@/lib/usage/credit-manager";
import { SUBSCRIPTION_TIER_CREDITS } from "@/lib/usage/types";

describe("Credit Manager", () => {
  describe("deductCreditsWithPriority", () => {
    it("should deduct from subscription credits first", () => {
      const result = deductCreditsWithPriority(100, 20, 50, 10, 30);

      expect(result.deductedFromSubscription).toBe(30);
      expect(result.deductedFromPurchased).toBe(0);
      expect(result.remainingSubscription).toBe(50); // 100 - 20 - 30
      expect(result.remainingPurchased).toBe(40); // 50 - 10
    });

    it("should deduct from purchased credits when subscription is insufficient", () => {
      const result = deductCreditsWithPriority(100, 90, 50, 10, 30);

      expect(result.deductedFromSubscription).toBe(10); // Only 10 available
      expect(result.deductedFromPurchased).toBe(20); // Remaining 20
      expect(result.remainingSubscription).toBe(0);
      expect(result.remainingPurchased).toBe(20); // 50 - 10 - 20
    });

    it("should throw error when insufficient total credits", () => {
      expect(() => {
        deductCreditsWithPriority(100, 95, 50, 45, 20);
      }).toThrow("Insufficient credits");
    });
  });

  describe("calculateRolloverCredits", () => {
    it("should calculate correct rollover for unused purchased credits", () => {
      const rollover = calculateRolloverCredits(200, 150);
      expect(rollover).toBe(50);
    });

    it("should return 0 when all purchased credits were used", () => {
      const rollover = calculateRolloverCredits(200, 200);
      expect(rollover).toBe(0);
    });

    it("should return 0 when more credits were used than available", () => {
      const rollover = calculateRolloverCredits(200, 250);
      expect(rollover).toBe(0);
    });
  });

  describe("initializePeriodCredits", () => {
    describe("Free tier behavior", () => {
      it("should give subscription credits only on first period", () => {
        const firstPeriod = initializePeriodCredits("free", 0, true);

        expect(firstPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.free
        );
        expect(firstPeriod.usedSubscriptionCredits).toBe(0);
        expect(firstPeriod.purchasedCredits).toBe(0);
        expect(firstPeriod.usedPurchasedCredits).toBe(0);
      });

      it("should NOT give subscription credits on subsequent periods", () => {
        const subsequentPeriod = initializePeriodCredits("free", 0, false);

        expect(subsequentPeriod.subscriptionCredits).toBe(0);
        expect(subsequentPeriod.usedSubscriptionCredits).toBe(0);
        expect(subsequentPeriod.purchasedCredits).toBe(0);
        expect(subsequentPeriod.usedPurchasedCredits).toBe(0);
      });

      it("should preserve purchased credits rollover even when subscription credits expire", () => {
        const subsequentPeriod = initializePeriodCredits("free", 150, false);

        expect(subsequentPeriod.subscriptionCredits).toBe(0); // Expired
        expect(subsequentPeriod.usedSubscriptionCredits).toBe(0);
        expect(subsequentPeriod.purchasedCredits).toBe(150); // Rolled over
        expect(subsequentPeriod.usedPurchasedCredits).toBe(0);
      });

      it("should handle purchased credits rollover on first period", () => {
        // Edge case: user had purchased credits before their first "official" period
        const firstPeriodWithRollover = initializePeriodCredits(
          "free",
          75,
          true
        );

        expect(firstPeriodWithRollover.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.free
        );
        expect(firstPeriodWithRollover.usedSubscriptionCredits).toBe(0);
        expect(firstPeriodWithRollover.purchasedCredits).toBe(75);
        expect(firstPeriodWithRollover.usedPurchasedCredits).toBe(0);
      });
    });

    describe("Paid tier behavior", () => {
      it("should always give subscription credits for pro tier", () => {
        const firstPeriod = initializePeriodCredits("pro", 0, true);
        const subsequentPeriod = initializePeriodCredits("pro", 0, false);

        expect(firstPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.pro
        );
        expect(subsequentPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.pro
        );
      });

      it("should always give subscription credits for team tier", () => {
        const firstPeriod = initializePeriodCredits("team", 0, true);
        const subsequentPeriod = initializePeriodCredits("team", 0, false);

        expect(firstPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.team
        );
        expect(subsequentPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.team
        );
      });

      it("should always give subscription credits for enterprise tier", () => {
        const firstPeriod = initializePeriodCredits("enterprise", 0, true);
        const subsequentPeriod = initializePeriodCredits(
          "enterprise",
          0,
          false
        );

        expect(firstPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.enterprise
        );
        expect(subsequentPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.enterprise
        );
      });

      it("should preserve purchased credits rollover for paid tiers", () => {
        const subsequentPeriod = initializePeriodCredits("pro", 300, false);

        expect(subsequentPeriod.subscriptionCredits).toBe(
          SUBSCRIPTION_TIER_CREDITS.pro
        );
        expect(subsequentPeriod.usedSubscriptionCredits).toBe(0);
        expect(subsequentPeriod.purchasedCredits).toBe(300);
        expect(subsequentPeriod.usedPurchasedCredits).toBe(0);
      });
    });

    describe("Backward compatibility", () => {
      it("should default isFirstPeriod to false when not provided", () => {
        const result = initializePeriodCredits("free", 0);

        // Should behave as subsequent period (no subscription credits for free tier)
        expect(result.subscriptionCredits).toBe(0);
      });
    });
  });

  describe("calculateCreditBalance", () => {
    it("should calculate correct balance breakdown", () => {
      const balance = calculateCreditBalance(1000, 300, 500, 100);

      expect(balance.subscriptionCredits).toBe(1000);
      expect(balance.usedSubscriptionCredits).toBe(300);
      expect(balance.availableSubscriptionCredits).toBe(700);
      expect(balance.purchasedCredits).toBe(500);
      expect(balance.usedPurchasedCredits).toBe(100);
      expect(balance.availablePurchasedCredits).toBe(400);
      expect(balance.totalAvailableCredits).toBe(1500);
      expect(balance.totalUsedCredits).toBe(400);
      expect(balance.totalRemainingCredits).toBe(1100);
    });

    it("should handle zero values correctly", () => {
      const balance = calculateCreditBalance(0, 0, 0, 0);

      expect(balance.totalAvailableCredits).toBe(0);
      expect(balance.totalUsedCredits).toBe(0);
      expect(balance.totalRemainingCredits).toBe(0);
    });
  });

  describe("checkSufficientCredits", () => {
    it("should return true when sufficient credits available", () => {
      const result = checkSufficientCredits(1000, 300, 500, 100, 800);

      expect(result.hasCredits).toBe(true);
      expect(result.totalAvailableCredits).toBe(1500);
      expect(result.totalUsedCredits).toBe(400);
    });

    it("should return false when insufficient credits", () => {
      const result = checkSufficientCredits(1000, 300, 500, 100, 1200);

      expect(result.hasCredits).toBe(false);
      expect(result.totalAvailableCredits).toBe(1500);
      expect(result.totalUsedCredits).toBe(400);
    });

    it("should include detailed credit balance", () => {
      const result = checkSufficientCredits(1000, 300, 500, 100, 800);

      expect(result.creditBalance.availableSubscriptionCredits).toBe(700);
      expect(result.creditBalance.availablePurchasedCredits).toBe(400);
      expect(result.creditBalance.totalRemainingCredits).toBe(1100);
    });
  });

  describe("Free tier edge cases", () => {
    it("should handle free tier user who upgrades and then downgrades", () => {
      // First period as free user
      const firstPeriod = initializePeriodCredits("free", 0, true);
      expect(firstPeriod.subscriptionCredits).toBe(
        SUBSCRIPTION_TIER_CREDITS.free
      );

      // User upgrades to pro (gets pro credits)
      const upgradedPeriod = initializePeriodCredits("pro", 0, false);
      expect(upgradedPeriod.subscriptionCredits).toBe(
        SUBSCRIPTION_TIER_CREDITS.pro
      );

      // User downgrades back to free (no more subscription credits)
      const downgradedPeriod = initializePeriodCredits("free", 200, false);
      expect(downgradedPeriod.subscriptionCredits).toBe(0);
      expect(downgradedPeriod.purchasedCredits).toBe(200); // Purchased credits preserved
    });

    it("should handle free tier user with only purchased credits", () => {
      // Free user in subsequent period with only purchased credits
      const result = initializePeriodCredits("free", 500, false);

      expect(result.subscriptionCredits).toBe(0);
      expect(result.purchasedCredits).toBe(500);

      // They can still use the system with purchased credits
      const creditCheck = checkSufficientCredits(0, 0, 500, 0, 100);
      expect(creditCheck.hasCredits).toBe(true);
    });
  });
});
