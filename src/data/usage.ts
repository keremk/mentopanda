import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import pricingData from "./pricing.json";

// Subscription tier credit allocations (monthly)
export const SUBSCRIPTION_TIER_CREDITS = {
  free: 100,
  pro: 1000,
  team: 5000,
  enterprise: 10000,
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIER_CREDITS;

// Credit management types
export type CreditUpdate = {
  creditsToAdd?: number;
  creditsToDeduct?: number;
};

// Credit system configuration
export const CREDIT_CONFIG = {
  // 1 credit = $0.05 USD (adjust as needed)
  CREDIT_VALUE_USD: 0.05,

  // Margin multiplier (50% markup = 1.5)
  MARGIN_MULTIPLIER: 1.5,
} as const;

// Helper function to calculate credits from USD cost
function calculateCreditsFromUSD(costUSD: number): number {
  return (
    (costUSD * CREDIT_CONFIG.MARGIN_MULTIPLIER) / CREDIT_CONFIG.CREDIT_VALUE_USD
  );
}

// Get pricing for text models (per 1M tokens)
function getTextModelPricing(
  modelName: string
): { input: number; cachedInput: number; output: number } | null {
  const model = pricingData.latest_models_text_tokens.find(
    (m) => m.model === modelName
  );
  if (!model) return null;

  return {
    input: model.input / 1_000_000, // Convert from per 1M to per token
    cachedInput: (model.cached_input || model.input) / 1_000_000,
    output: model.output / 1_000_000,
  };
}

// Get pricing for image generation
function getImagePricing(
  modelName: string,
  quality: ImageQuality,
  size: ImageSize
): number {
  const sizeMap = {
    square: "1024x1024",
    portrait: "1024x1536",
    landscape: "1536x1024",
  };

  const dimensions = sizeMap[size];

  // Try original model name first, then try with underscore conversion
  let imageModel =
    pricingData.image_generation[
      modelName as keyof typeof pricingData.image_generation
    ];

  if (!imageModel && modelName.includes("-")) {
    // Convert hyphens to underscores and try again
    const underscoreModelName = modelName.replace(/-/g, "_");
    imageModel =
      pricingData.image_generation[
        underscoreModelName as keyof typeof pricingData.image_generation
      ];
  }

  if (!imageModel) {
    return 0;
  }

  const qualityPricing = imageModel[quality as keyof typeof imageModel];
  if (!qualityPricing) {
    return 0;
  }

  return qualityPricing[dimensions as keyof typeof qualityPricing] || 0;
}

// Get transcription pricing (per minute)
function getTranscriptionPricing(): number {
  return pricingData.whisper.transcription_per_minute;
}

// Get realtime audio pricing
function getRealtimePricing(modelName: string): {
  inputText: number;
  inputAudio: number;
  outputText: number;
  outputAudio: number;
} | null {
  // Find in text models for text pricing
  const textModel = pricingData.latest_models_text_tokens.find(
    (m) => m.model === modelName
  );
  if (!textModel) return null;

  // Find in audio models for audio pricing
  const audioModel = pricingData.image_tokens.find(
    (m) => m.model === modelName
  );
  if (!audioModel) return null;

  return {
    inputText: textModel.input / 1_000_000,
    inputAudio: audioModel.input / 1_000_000,
    outputText: textModel.output / 1_000_000,
    outputAudio: audioModel.output / 1_000_000,
  };
}

// Helper to get current user ID
async function getCurrentUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("User not authenticated");
  }
  return user.id;
}

// Image quality and size types
export type ImageQuality = "low" | "medium" | "high";
export type ImageSize = "square" | "portrait" | "landscape";

// Helper functions for image keys
function createImageKey(quality: ImageQuality, size: ImageSize): string {
  return `${quality}-${size}`;
}

// Helper function to map pixel dimensions to size
export function mapDimensionsToSize(dimensions: string): ImageSize {
  switch (dimensions) {
    case "1024x1024":
      return "square";
    case "1024x1536":
      return "portrait";
    case "1536x1024":
      return "landscape";
    default:
      // Default fallback for unknown dimensions
      return "square";
  }
}

// Base usage per model
type BaseModelUsage = {
  requestCount: number;
  lastUpdated: string;
};

// Assessment usage - text only
type AssessmentModelUsage = BaseModelUsage & {
  promptTokens: {
    text: {
      cached: number;
      notCached: number;
    };
  };
  outputTokens: number;
  totalTokens: number;
};

// Prompt Helper usage - text only
type PromptHelperModelUsage = BaseModelUsage & {
  promptTokens: {
    text: {
      cached: number;
      notCached: number;
    };
  };
  outputTokens: number;
  totalTokens: number;
};

// Image usage - text + image tokens with quality and size tracking
type ImageModelUsage = BaseModelUsage & {
  promptTokens: {
    text: {
      cached: number;
      notCached: number;
    };
    image: {
      cached: number;
      notCached: number;
    };
  };
  outputTokens: number;
  totalTokens: number;
  meanTimeElapsed: number; // Average elapsed time across all generations
  maxTimeElapsed: number; // Maximum elapsed time for any single generation
  quality: ImageQuality;
  size: ImageSize;
};

// Conversation usage - text + audio
type ConversationModelUsage = BaseModelUsage & {
  promptTokens: {
    text: {
      cached: number;
      notCached: number;
    };
    audio: {
      cached: number;
      notCached: number;
    };
  };
  outputTokens: {
    text: number;
    audio: number;
  };
  totalTokens: number;
  totalSessionLength: number; // in seconds
};

// Transcription usage - character-based, not token-based
type TranscriptionModelUsage = BaseModelUsage & {
  totalSessionLength: number; // in seconds
  userChars: number;
  agentChars: number;
};

// Category types that map model names to their usage
export type AssessmentUsage = Record<string, AssessmentModelUsage>;
export type PromptHelperUsage = Record<string, PromptHelperModelUsage>;
// Image usage now maps model -> quality-size compound key -> usage data
export type ImageUsage = Record<string, Record<string, ImageModelUsage>>;
export type ConversationUsage = Record<string, ConversationModelUsage>;
export type TranscriptionUsage = Record<string, TranscriptionModelUsage>;

// Main usage record type
export type Usage = {
  id: number;
  userId: string;
  periodStart: Date;
  images: ImageUsage;
  assessment: AssessmentUsage;
  promptHelper: PromptHelperUsage;
  conversation: ConversationUsage;
  transcription: TranscriptionUsage;
  availableCredits: number;
  usedCredits: number;
  createdAt: Date;
  updatedAt: Date;
};

// Database row type
type UsageRow = {
  id: number;
  user_id: string;
  period_start: string;
  images: ImageUsage;
  assessment: AssessmentUsage;
  prompt_helper: PromptHelperUsage;
  conversation: ConversationUsage;
  transcription: TranscriptionUsage;
  available_credits: string;
  used_credits: string;
  created_at: string;
  updated_at: string;
};

// Update input types for each category
export type AssessmentUpdate = {
  modelName: string;
  promptTokens: {
    text: {
      cached?: number;
      notCached?: number;
    };
  };
  outputTokens?: number;
  totalTokens?: number;
};

export type PromptHelperUpdate = {
  modelName: string;
  promptTokens: {
    text: {
      cached?: number;
      notCached?: number;
    };
  };
  outputTokens?: number;
  totalTokens?: number;
};

export type ImageUpdate = {
  modelName: string;
  quality: ImageQuality;
  size: ImageSize;
  promptTokens: {
    text?: {
      cached?: number;
      notCached?: number;
    };
    image?: {
      cached?: number;
      notCached?: number;
    };
  };
  outputTokens?: number;
  totalTokens?: number;
  elapsedTimeSeconds?: number;
};

export type ConversationUpdate = {
  modelName: string;
  promptTokens: {
    text?: {
      cached?: number;
      notCached?: number;
    };
    audio?: {
      cached?: number;
      notCached?: number;
    };
  };
  outputTokens?: {
    text?: number;
    audio?: number;
  };
  totalTokens?: number;
  totalSessionLength?: number;
};

export type TranscriptionUpdate = {
  modelName: string;
  totalSessionLength?: number;
  userChars?: number;
  agentChars?: number;
};

// Get current usage period for the authenticated user
export async function getCurrentUsage(
  supabase: SupabaseClient
): Promise<Usage | null> {
  const userId = await getCurrentUserId(supabase);

  // Use the helper function to get current period usage
  const { data: usageId, error: rpcError } = await supabase.rpc(
    "get_or_create_current_usage",
    { target_user_id: userId }
  );

  if (rpcError) handleError(rpcError);

  if (!usageId) return null;

  const { data, error } = await supabase
    .from("usage")
    .select("*")
    .eq("id", usageId)
    .single();

  if (error) handleError(error);

  if (!data) return null;

  const usage = mapUsageFromDB(data);

  // Check if this is a new record that needs credit initialization
  // (i.e., both available_credits and used_credits are 0)
  if (usage.availableCredits === 0 && usage.usedCredits === 0) {
    // Get user's subscription tier from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("pricing_plan")
      .eq("id", userId)
      .single();

    if (profileError) handleError(profileError);

    const subscriptionTier = (profile?.pricing_plan ||
      "free") as SubscriptionTier;
    const initialCredits = SUBSCRIPTION_TIER_CREDITS[subscriptionTier];

    // Initialize credits for this period
    const { data: updatedData, error: updateError } = await supabase
      .from("usage")
      .update({
        available_credits: initialCredits,
        used_credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", usageId)
      .select("*")
      .single();

    if (updateError) handleError(updateError);

    return mapUsageFromDB(updatedData);
  }

  return usage;
}

// Get usage for a specific period
export async function getUsageByPeriod(
  supabase: SupabaseClient,
  periodStart: Date
): Promise<Usage | null> {
  const userId = await getCurrentUserId(supabase);

  const { data, error } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("period_start", periodStart.toISOString().split("T")[0])
    .single();

  if (error) {
    // If no record exists for this period, return null (not an error)
    if (error.code === "PGRST116") return null;
    handleError(error);
  }

  if (!data) return null;

  return mapUsageFromDB(data);
}

// Update assessment usage
export async function updateAssessmentUsage(
  supabase: SupabaseClient,
  update: AssessmentUpdate
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentAssessment = current?.assessment || {};

  const existing = currentAssessment[update.modelName] || {
    promptTokens: { text: { cached: 0, notCached: 0 } },
    outputTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  const updatedAssessment: AssessmentUsage = {
    ...currentAssessment,
    [update.modelName]: {
      promptTokens: {
        text: {
          cached:
            existing.promptTokens.text.cached +
            (update.promptTokens.text.cached || 0),
          notCached:
            existing.promptTokens.text.notCached +
            (update.promptTokens.text.notCached || 0),
        },
      },
      outputTokens: existing.outputTokens + (update.outputTokens || 0),
      totalTokens: existing.totalTokens + (update.totalTokens || 0),
      requestCount: existing.requestCount + 1,
      lastUpdated: new Date().toISOString(),
    },
  };

  // Calculate credit cost and update used credits
  const creditCost = calculateAssessmentCreditCost(update);
  const currentUsedCredits = current?.usedCredits || 0;

  console.log(
    `[CREDITS] Assessment (${update.modelName}): ${creditCost.toFixed(3)} credits | Total: ${(currentUsedCredits + creditCost).toFixed(2)}`
  );

  return updateUsageRecord(supabase, {
    assessment: updatedAssessment,
    used_credits: currentUsedCredits + creditCost,
  });
}

// Update prompt helper usage
export async function updatePromptHelperUsage(
  supabase: SupabaseClient,
  update: PromptHelperUpdate
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentPromptHelper = current?.promptHelper || {};

  const existing = currentPromptHelper[update.modelName] || {
    promptTokens: { text: { cached: 0, notCached: 0 } },
    outputTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  const updatedPromptHelper: PromptHelperUsage = {
    ...currentPromptHelper,
    [update.modelName]: {
      promptTokens: {
        text: {
          cached:
            existing.promptTokens.text.cached +
            (update.promptTokens.text.cached || 0),
          notCached:
            existing.promptTokens.text.notCached +
            (update.promptTokens.text.notCached || 0),
        },
      },
      outputTokens: existing.outputTokens + (update.outputTokens || 0),
      totalTokens: existing.totalTokens + (update.totalTokens || 0),
      requestCount: existing.requestCount + 1,
      lastUpdated: new Date().toISOString(),
    },
  };

  // Calculate credit cost and update used credits
  const creditCost = calculatePromptHelperCreditCost(update);
  const currentUsedCredits = current?.usedCredits || 0;
  const newUsedCredits = currentUsedCredits + creditCost;

  console.log(
    `[CREDITS] Prompt Helper (${update.modelName}): ${creditCost.toFixed(3)} credits | Total: ${newUsedCredits.toFixed(2)}`
  );

  return updateUsageRecord(supabase, {
    prompt_helper: updatedPromptHelper,
    used_credits: newUsedCredits,
  });
}

// Update image usage
export async function updateImageUsage(
  supabase: SupabaseClient,
  update: ImageUpdate
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentImages = current?.images || {};

  // Get existing model usage or create empty object
  const modelUsage = currentImages[update.modelName] || {};
  const imageKey = createImageKey(update.quality, update.size);

  // Get existing usage for this quality-size combination
  const existing = modelUsage[imageKey] || {
    promptTokens: {
      text: { cached: 0, notCached: 0 },
      image: { cached: 0, notCached: 0 },
    },
    outputTokens: 0,
    totalTokens: 0,
    requestCount: 0,
    lastUpdated: new Date().toISOString(),
    meanTimeElapsed: 0,
    maxTimeElapsed: 0,
    quality: update.quality,
    size: update.size,
  };

  const newElapsedTime = update.elapsedTimeSeconds || 0;
  const newRequestCount = existing.requestCount + 1;
  const newMeanTimeElapsed =
    newElapsedTime > 0
      ? (existing.meanTimeElapsed * existing.requestCount + newElapsedTime) /
        newRequestCount
      : existing.meanTimeElapsed;
  const newMaxTimeElapsed = Math.max(existing.maxTimeElapsed, newElapsedTime);

  const updatedImages: ImageUsage = {
    ...currentImages,
    [update.modelName]: {
      ...modelUsage,
      [imageKey]: {
        promptTokens: {
          text: {
            cached:
              existing.promptTokens.text.cached +
              (update.promptTokens.text?.cached || 0),
            notCached:
              existing.promptTokens.text.notCached +
              (update.promptTokens.text?.notCached || 0),
          },
          image: {
            cached:
              existing.promptTokens.image.cached +
              (update.promptTokens.image?.cached || 0),
            notCached:
              existing.promptTokens.image.notCached +
              (update.promptTokens.image?.notCached || 0),
          },
        },
        outputTokens: existing.outputTokens + (update.outputTokens || 0),
        totalTokens: existing.totalTokens + (update.totalTokens || 0),
        requestCount: newRequestCount,
        lastUpdated: new Date().toISOString(),
        meanTimeElapsed: newMeanTimeElapsed,
        maxTimeElapsed: newMaxTimeElapsed,
        quality: update.quality,
        size: update.size,
      },
    },
  };

  // Calculate credit cost and update used credits
  const creditCost = calculateImageCreditCost(update);
  const currentUsedCredits = current?.usedCredits || 0;
  const newUsedCredits = currentUsedCredits + creditCost;

  console.log(
    `[CREDITS] Image (${update.modelName} ${update.quality}/${update.size}): ${creditCost.toFixed(3)} credits | Total: ${newUsedCredits.toFixed(2)}`
  );

  return updateUsageRecord(supabase, {
    images: updatedImages,
    used_credits: newUsedCredits,
  });
}

// Update conversation usage
export async function updateConversationUsage(
  supabase: SupabaseClient,
  update: ConversationUpdate
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentConversation = current?.conversation || {};

  const existing = currentConversation[update.modelName] || {
    promptTokens: {
      text: { cached: 0, notCached: 0 },
      audio: { cached: 0, notCached: 0 },
    },
    outputTokens: { text: 0, audio: 0 },
    totalTokens: 0,
    totalSessionLength: 0,
    requestCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  const updatedConversation: ConversationUsage = {
    ...currentConversation,
    [update.modelName]: {
      promptTokens: {
        text: {
          cached:
            existing.promptTokens.text.cached +
            (update.promptTokens.text?.cached || 0),
          notCached:
            existing.promptTokens.text.notCached +
            (update.promptTokens.text?.notCached || 0),
        },
        audio: {
          cached:
            existing.promptTokens.audio.cached +
            (update.promptTokens.audio?.cached || 0),
          notCached:
            existing.promptTokens.audio.notCached +
            (update.promptTokens.audio?.notCached || 0),
        },
      },
      outputTokens: {
        text: existing.outputTokens.text + (update.outputTokens?.text || 0),
        audio: existing.outputTokens.audio + (update.outputTokens?.audio || 0),
      },
      totalTokens: existing.totalTokens + (update.totalTokens || 0),
      totalSessionLength:
        existing.totalSessionLength + (update.totalSessionLength || 0),
      requestCount: existing.requestCount + 1,
      lastUpdated: new Date().toISOString(),
    },
  };

  // Calculate credit cost and update used credits
  const creditCost = calculateConversationCreditCost(update);
  const currentUsedCredits = current?.usedCredits || 0;

  console.log(
    `[CREDITS] Conversation (${update.modelName}): ${creditCost.toFixed(3)} credits | Total: ${(currentUsedCredits + creditCost).toFixed(2)}`
  );

  return updateUsageRecord(supabase, {
    conversation: updatedConversation,
    used_credits: currentUsedCredits + creditCost,
  });
}

// Update transcription usage
export async function updateTranscriptionUsage(
  supabase: SupabaseClient,
  update: TranscriptionUpdate
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentTranscription = current?.transcription || {};

  const existing = currentTranscription[update.modelName] || {
    totalSessionLength: 0,
    userChars: 0,
    agentChars: 0,
    requestCount: 0,
    lastUpdated: new Date().toISOString(),
  };

  const updatedTranscription: TranscriptionUsage = {
    ...currentTranscription,
    [update.modelName]: {
      totalSessionLength:
        existing.totalSessionLength + (update.totalSessionLength || 0),
      userChars: existing.userChars + (update.userChars || 0),
      agentChars: existing.agentChars + (update.agentChars || 0),
      requestCount: existing.requestCount + 1,
      lastUpdated: new Date().toISOString(),
    },
  };

  // Calculate credit cost and update used credits
  const creditCost = calculateTranscriptionCreditCost(update);
  const currentUsedCredits = current?.usedCredits || 0;

  console.log(
    `[CREDITS] Transcription (${update.modelName}): ${creditCost.toFixed(3)} credits | Total: ${(currentUsedCredits + creditCost).toFixed(2)}`
  );

  return updateUsageRecord(supabase, {
    transcription: updatedTranscription,
    used_credits: currentUsedCredits + creditCost,
  });
}

// Get usage history for a user
export async function getUserUsageHistory(
  supabase: SupabaseClient,
  limit: number = 12
): Promise<Usage[]> {
  const userId = await getCurrentUserId(supabase);

  const { data, error } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) handleError(error);

  if (!data) return [];

  return data.map(mapUsageFromDB);
}

// Helper function to update usage record
async function updateUsageRecord(
  supabase: SupabaseClient,
  updates: Partial<{
    images: ImageUsage;
    assessment: AssessmentUsage;
    prompt_helper: PromptHelperUsage;
    conversation: ConversationUsage;
    transcription: TranscriptionUsage;
    available_credits: number;
    used_credits: number;
  }>
): Promise<Usage> {
  const userId = await getCurrentUserId(supabase);

  // Get or create current usage record
  const { data: usageId, error: rpcError } = await supabase.rpc(
    "get_or_create_current_usage",
    { target_user_id: userId }
  );

  if (rpcError) {
    handleError(rpcError);
  }

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("usage")
    .update(updateData)
    .eq("id", usageId)
    .select("*")
    .single();

  if (error) {
    handleError(error);
  }

  return mapUsageFromDB(data);
}

// Helper function to map database record to Usage type
function mapUsageFromDB(data: UsageRow): Usage {
  return {
    id: data.id,
    userId: data.user_id,
    periodStart: new Date(data.period_start),
    images: data.images || {},
    assessment: data.assessment || {},
    promptHelper: data.prompt_helper || {},
    conversation: data.conversation || {},
    transcription: data.transcription || {},
    availableCredits: parseFloat(data.available_credits) || 0,
    usedCredits: parseFloat(data.used_credits) || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Helper function to get total image usage for a model across all quality-size combinations
export function getTotalImageUsageForModel(
  imageUsage: ImageUsage,
  modelName: string
): {
  totalTokens: number;
  totalRequests: number;
  totalElapsedTime: number;
  combinations: Array<{
    key: string;
    quality: ImageQuality;
    size: ImageSize;
    usage: ImageModelUsage;
  }>;
} {
  const modelUsage = imageUsage[modelName] || {};

  let totalTokens = 0;
  let totalRequests = 0;
  let totalElapsedTime = 0;
  const combinations: Array<{
    key: string;
    quality: ImageQuality;
    size: ImageSize;
    usage: ImageModelUsage;
  }> = [];

  Object.entries(modelUsage).forEach(([key, usage]) => {
    totalTokens += usage.totalTokens;
    totalRequests += usage.requestCount;
    totalElapsedTime += usage.meanTimeElapsed * usage.requestCount; // Total elapsed time

    combinations.push({
      key,
      quality: usage.quality,
      size: usage.size,
      usage,
    });
  });

  return {
    totalTokens,
    totalRequests,
    totalElapsedTime,
    combinations,
  };
}

// Credit Management Functions

// Check if user has sufficient credits for an operation
export async function checkCreditAvailability(
  supabase: SupabaseClient,
  creditsRequired: number
): Promise<{
  hasCredits: boolean;
  availableCredits: number;
  usedCredits: number;
}> {
  const current = await getCurrentUsage(supabase);

  if (!current) {
    return { hasCredits: false, availableCredits: 0, usedCredits: 0 };
  }

  const remainingCredits = current.availableCredits - current.usedCredits;

  return {
    hasCredits: remainingCredits >= creditsRequired,
    availableCredits: current.availableCredits,
    usedCredits: current.usedCredits,
  };
}

// Add credits to user's current period
export async function addCredits(
  supabase: SupabaseClient,
  creditsToAdd: number
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentCredits = current?.availableCredits || 0;

  return updateUsageRecord(supabase, {
    available_credits: currentCredits + creditsToAdd,
  });
}

// Deduct credits from user's current period
export async function deductCredits(
  supabase: SupabaseClient,
  creditsToDeduct: number
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);
  const currentUsedCredits = current?.usedCredits || 0;

  return updateUsageRecord(supabase, {
    used_credits: currentUsedCredits + creditsToDeduct,
  });
}

// Initialize credits for a new period based on subscription tier
export async function initializePeriodCredits(
  supabase: SupabaseClient,
  subscriptionTier: SubscriptionTier
): Promise<Usage> {
  const baseCredits = SUBSCRIPTION_TIER_CREDITS[subscriptionTier];

  return updateUsageRecord(supabase, {
    available_credits: baseCredits,
    used_credits: 0,
  });
}

// Get current credit balance
export async function getCreditBalance(supabase: SupabaseClient): Promise<{
  availableCredits: number;
  usedCredits: number;
  remainingCredits: number;
} | null> {
  const current = await getCurrentUsage(supabase);

  if (!current) return null;

  return {
    availableCredits: current.availableCredits,
    usedCredits: current.usedCredits,
    remainingCredits: current.availableCredits - current.usedCredits,
  };
}

// Calculate credit cost for different usage types using real pricing data
export function calculateAssessmentCreditCost(
  update: AssessmentUpdate
): number {
  const pricing = getTextModelPricing(update.modelName);

  if (!pricing) {
    return 0;
  }

  const cachedTokens = update.promptTokens.text.cached || 0;
  const notCachedTokens = update.promptTokens.text.notCached || 0;
  const outputTokens = update.outputTokens || 0;

  const costUSD =
    cachedTokens * pricing.cachedInput +
    notCachedTokens * pricing.input +
    outputTokens * pricing.output;

  return calculateCreditsFromUSD(costUSD);
}

export function calculatePromptHelperCreditCost(
  update: PromptHelperUpdate
): number {
  const pricing = getTextModelPricing(update.modelName);

  if (!pricing) {
    return 0;
  }

  const cachedTokens = update.promptTokens.text.cached || 0;
  const notCachedTokens = update.promptTokens.text.notCached || 0;
  const outputTokens = update.outputTokens || 0;

  const costUSD =
    cachedTokens * pricing.cachedInput +
    notCachedTokens * pricing.input +
    outputTokens * pricing.output;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateImageCreditCost(update: ImageUpdate): number {
  const costUSD = getImagePricing(
    update.modelName,
    update.quality,
    update.size
  );
  return calculateCreditsFromUSD(costUSD);
}

export function calculateConversationCreditCost(
  update: ConversationUpdate
): number {
  const pricing = getRealtimePricing(update.modelName);

  if (!pricing) {
    return 0;
  }

  const textCachedTokens = update.promptTokens.text?.cached || 0;
  const textNotCachedTokens = update.promptTokens.text?.notCached || 0;
  const audioCachedTokens = update.promptTokens.audio?.cached || 0;
  const audioNotCachedTokens = update.promptTokens.audio?.notCached || 0;
  const outputTextTokens = update.outputTokens?.text || 0;
  const outputAudioTokens = update.outputTokens?.audio || 0;

  const costUSD =
    textCachedTokens * pricing.inputText * 0.5 + // Assuming 50% discount for cached
    textNotCachedTokens * pricing.inputText +
    audioCachedTokens * pricing.inputAudio * 0.5 + // Assuming 50% discount for cached
    audioNotCachedTokens * pricing.inputAudio +
    outputTextTokens * pricing.outputText +
    outputAudioTokens * pricing.outputAudio;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateTranscriptionCreditCost(
  update: TranscriptionUpdate
): number {
  const sessionLengthMinutes = (update.totalSessionLength || 0) / 60;
  const costPerMinute = getTranscriptionPricing();
  const costUSD = sessionLengthMinutes * costPerMinute;

  return calculateCreditsFromUSD(costUSD);
}