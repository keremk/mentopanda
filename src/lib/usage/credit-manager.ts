import {
  SUBSCRIPTION_TIER_CREDITS,
  type SubscriptionTier,
  type CreditDeductionResult,
  type CreditBalance,
} from "./types";

// Pure function to deduct credits following priority (subscription first, then purchased)
export function deductCreditsWithPriority(
  subscriptionCredits: number,
  usedSubscriptionCredits: number,
  purchasedCredits: number,
  usedPurchasedCredits: number,
  creditsToDeduct: number
): CreditDeductionResult {
  const availableSubscription = subscriptionCredits - usedSubscriptionCredits;
  const availablePurchased = purchasedCredits - usedPurchasedCredits;

  if (availableSubscription + availablePurchased < creditsToDeduct) {
    throw new Error(
      `Insufficient credits. Available: ${availableSubscription + availablePurchased}, Required: ${creditsToDeduct}`
    );
  }

  let deductedFromSubscription = 0;
  let deductedFromPurchased = 0;
  let remainingToDeduct = creditsToDeduct;

  // First, deduct from subscription credits
  if (availableSubscription > 0 && remainingToDeduct > 0) {
    deductedFromSubscription = Math.min(
      availableSubscription,
      remainingToDeduct
    );
    remainingToDeduct -= deductedFromSubscription;
  }

  // Then, deduct from purchased credits if needed
  if (remainingToDeduct > 0) {
    deductedFromPurchased = remainingToDeduct;
  }

  return {
    deductedFromSubscription,
    deductedFromPurchased,
    remainingSubscription: availableSubscription - deductedFromSubscription,
    remainingPurchased: availablePurchased - deductedFromPurchased,
  };
}

// Pure function to calculate rollover purchased credits
export function calculateRolloverCredits(
  previousPurchasedCredits: number,
  previousUsedPurchasedCredits: number
): number {
  return Math.max(0, previousPurchasedCredits - previousUsedPurchasedCredits);
}

// Pure function to initialize credits for a new period
export function initializePeriodCredits(
  subscriptionTier: SubscriptionTier,
  rolloverPurchasedCredits: number = 0,
  isFirstPeriod: boolean = false
): {
  subscriptionCredits: number;
  usedSubscriptionCredits: number;
  purchasedCredits: number;
  usedPurchasedCredits: number;
} {
  let subscriptionCredits = 0;

  if (subscriptionTier === "free") {
    // Free tier: Only get subscription credits on first period (one-time)
    // After that, subscription credits are always 0 (they expire/reset)
    subscriptionCredits = isFirstPeriod
      ? SUBSCRIPTION_TIER_CREDITS[subscriptionTier]
      : 0;
  } else {
    // Paid tiers: Always get fresh subscription credits each period
    subscriptionCredits = SUBSCRIPTION_TIER_CREDITS[subscriptionTier];
  }

  return {
    subscriptionCredits,
    usedSubscriptionCredits: 0,
    purchasedCredits: rolloverPurchasedCredits,
    usedPurchasedCredits: 0,
  };
}

// Pure function to calculate credit balance breakdown
export function calculateCreditBalance(
  subscriptionCredits: number,
  usedSubscriptionCredits: number,
  purchasedCredits: number,
  usedPurchasedCredits: number
): CreditBalance {
  const availableSubscriptionCredits =
    subscriptionCredits - usedSubscriptionCredits;
  const availablePurchasedCredits = purchasedCredits - usedPurchasedCredits;
  const totalAvailableCredits = subscriptionCredits + purchasedCredits;
  const totalUsedCredits = usedSubscriptionCredits + usedPurchasedCredits;
  const totalRemainingCredits =
    availableSubscriptionCredits + availablePurchasedCredits;

  return {
    subscriptionCredits,
    usedSubscriptionCredits,
    availableSubscriptionCredits,
    purchasedCredits,
    usedPurchasedCredits,
    availablePurchasedCredits,
    totalAvailableCredits,
    totalUsedCredits,
    totalRemainingCredits,
  };
}

// Pure function to check if sufficient credits are available
export function checkSufficientCredits(
  subscriptionCredits: number,
  usedSubscriptionCredits: number,
  purchasedCredits: number,
  usedPurchasedCredits: number,
  creditsRequired: number
): {
  hasCredits: boolean;
  totalAvailableCredits: number;
  totalUsedCredits: number;
  creditBalance: CreditBalance;
} {
  const creditBalance = calculateCreditBalance(
    subscriptionCredits,
    usedSubscriptionCredits,
    purchasedCredits,
    usedPurchasedCredits
  );

  return {
    hasCredits: creditBalance.totalRemainingCredits >= creditsRequired,
    totalAvailableCredits: creditBalance.totalAvailableCredits,
    totalUsedCredits: creditBalance.totalUsedCredits,
    creditBalance,
  };
}
