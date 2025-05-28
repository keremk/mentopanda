// Subscription tier credit allocations (monthly)
export const SUBSCRIPTION_TIER_CREDITS = {
  free: 75,
  pro: 500,
  team: 1000,
  enterprise: 10000,
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIER_CREDITS;

// Credit system configuration
export const CREDIT_CONFIG = {
  // 1 credit = $0.05 USD (adjust as needed)
  CREDIT_VALUE_USD: 0.05,

  // Margin multiplier (50% markup = 1.5)
  MARGIN_MULTIPLIER: 1.5,
} as const;

// Image configuration - SINGLE SOURCE OF TRUTH
export const IMAGE_CONFIG = {
  // Aspect ratio to dimensions mapping
  ASPECT_RATIO_TO_DIMENSIONS: {
    landscape: "1536x1024",
    portrait: "1024x1536",
    square: "1024x1024",
  } as const,

  // Dimensions to size mapping
  DIMENSIONS_TO_SIZE: {
    "1536x1024": "landscape",
    "1024x1536": "portrait",
    "1024x1024": "square",
  } as const,

  // Available qualities
  QUALITIES: ["low", "medium", "high"] as const,

  // Available aspect ratios
  ASPECT_RATIOS: ["landscape", "portrait", "square"] as const,
} as const;

// Image types derived from the single source of truth
export type ImageQuality = (typeof IMAGE_CONFIG.QUALITIES)[number];
export type ImageAspectRatio = (typeof IMAGE_CONFIG.ASPECT_RATIOS)[number];
export type ImageSize =
  (typeof IMAGE_CONFIG.DIMENSIONS_TO_SIZE)[keyof typeof IMAGE_CONFIG.DIMENSIONS_TO_SIZE];
export type ImageDimensions = keyof typeof IMAGE_CONFIG.DIMENSIONS_TO_SIZE;

// Helper functions for image mappings
export function mapAspectRatioToDimensions(
  aspectRatio: ImageAspectRatio
): ImageDimensions {
  return IMAGE_CONFIG.ASPECT_RATIO_TO_DIMENSIONS[aspectRatio];
}

export function mapDimensionsToSize(dimensions: ImageDimensions): ImageSize {
  return IMAGE_CONFIG.DIMENSIONS_TO_SIZE[dimensions];
}

export function mapAspectRatioToSize(aspectRatio: ImageAspectRatio): ImageSize {
  return mapDimensionsToSize(mapAspectRatioToDimensions(aspectRatio));
}

// Credit deduction result
export type CreditDeductionResult = {
  deductedFromSubscription: number;
  deductedFromPurchased: number;
  remainingSubscription: number;
  remainingPurchased: number;
};

// Credit balance breakdown
export type CreditBalance = {
  subscriptionCredits: number;
  usedSubscriptionCredits: number;
  availableSubscriptionCredits: number;
  purchasedCredits: number;
  usedPurchasedCredits: number;
  availablePurchasedCredits: number;
  totalAvailableCredits: number;
  totalUsedCredits: number;
  totalRemainingCredits: number;
};

// Token usage for calculations
export type TokenUsage = {
  cachedTokens?: number;
  notCachedTokens?: number;
  outputTokens?: number;
};

// Audio token usage
export type AudioTokenUsage = {
  textTokens: TokenUsage;
  audioTokens: TokenUsage;
  outputTextTokens?: number;
  outputAudioTokens?: number;
};

// Image generation parameters
export type ImageGenerationParams = {
  modelName: string;
  quality: ImageQuality;
  size: ImageSize;
  textTokens?: TokenUsage;
  imageTokens?: TokenUsage;
};

// Transcription parameters
export type TranscriptionParams = {
  sessionLengthMinutes: number;
};
