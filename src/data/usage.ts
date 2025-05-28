import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId } from "./user";
import { logger } from "@/lib/logger";

// Import business logic
import {
  calculateTextModelCreditCost,
  calculateImageCreditCost,
  calculateConversationCreditCost,
  calculateTranscriptionCreditCost,
} from "@/lib/usage/credit-calculator";
import {
  deductCreditsWithPriority,
  calculateRolloverCredits,
  initializePeriodCredits as initializePeriodCreditsLogic,
  calculateCreditBalance as calculateCreditBalanceLogic,
  checkSufficientCredits,
} from "@/lib/usage/credit-manager";
import {
  type SubscriptionTier,
  type CreditBalance,
  type ImageQuality,
  type ImageSize,
} from "@/lib/usage/types";

// Credit management types
export type CreditUpdate = {
  creditsToAdd?: number;
  creditsToDeduct?: number;
};

// Helper function to initialize credits for a new period with rollover logic
async function initializePeriodCreditsInternal(
  supabase: SupabaseClient,
  userId: string,
  usageId: number,
  subscriptionTier: SubscriptionTier
): Promise<Usage> {
  // Get previous period's purchased credits to roll over
  // IMPORTANT: Exclude the current usage record (usageId) when checking for previous periods
  const { data: previousUsage } = await supabase
    .from("usage")
    .select("purchased_credits, used_purchased_credits")
    .eq("user_id", userId)
    .neq("id", usageId) // Exclude current record
    .order("period_start", { ascending: false })
    .limit(1);

  let rolloverPurchasedCredits = 0;
  let isFirstPeriod = false;

  if (previousUsage && previousUsage.length > 0) {
    const prev = previousUsage[0];
    const prevPurchased = parseFloat(prev.purchased_credits) || 0;
    const prevUsedPurchased = parseFloat(prev.used_purchased_credits) || 0;
    rolloverPurchasedCredits = calculateRolloverCredits(
      prevPurchased,
      prevUsedPurchased
    );
    isFirstPeriod = false; // Has previous usage, so not first period
  } else {
    isFirstPeriod = true; // No previous usage, so this is first period
  }

  // Use business logic to initialize credits
  const creditData = initializePeriodCreditsLogic(
    subscriptionTier,
    rolloverPurchasedCredits,
    isFirstPeriod
  );

  // Initialize credits for this period
  const { data: updatedData, error: updateError } = await supabase
    .from("usage")
    .update({
      subscription_credits: creditData.subscriptionCredits,
      used_subscription_credits: creditData.usedSubscriptionCredits,
      purchased_credits: creditData.purchasedCredits,
      used_purchased_credits: creditData.usedPurchasedCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", usageId)
    .select("*")
    .single();

  if (updateError) handleError(updateError);

  return mapUsageFromDB(updatedData);
}

// Helper functions for image keys
function createImageKey(quality: ImageQuality, size: ImageSize): string {
  return `${quality}-${size}`;
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
  subscriptionCredits: number;
  usedSubscriptionCredits: number;
  purchasedCredits: number;
  usedPurchasedCredits: number;
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
  subscription_credits: string;
  used_subscription_credits: string;
  purchased_credits: string;
  used_purchased_credits: string;
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
  const userId = await getUserId(supabase);

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
  // (i.e., subscription credits are 0, indicating a new billing period)
  if (usage.subscriptionCredits === 0) {
    // Get user's subscription tier from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("pricing_plan")
      .eq("id", userId)
      .single();

    if (profileError) handleError(profileError);

    const subscriptionTier = (profile?.pricing_plan ||
      "free") as SubscriptionTier;

    // Initialize subscription credits and roll over any purchased credits from previous period
    const initializedUsage = await initializePeriodCreditsInternal(
      supabase,
      userId,
      usageId,
      subscriptionTier
    );

    return initializedUsage;
  }

  return usage;
}

// Get usage for a specific period
export async function getUsageByPeriod(
  supabase: SupabaseClient,
  periodStart: Date
): Promise<Usage | null> {
  const userId = await getUserId(supabase);

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

  // Calculate credit cost and deduct credits
  const creditCost = calculateTextModelCreditCost(update.modelName, {
    cachedTokens: update.promptTokens.text.cached || 0,
    notCachedTokens: update.promptTokens.text.notCached || 0,
    outputTokens: update.outputTokens || 0,
  });

  if (!current) {
    throw new Error("No current usage record found");
  }

  const deductionResult = deductCreditsWithPriority(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditCost
  );

  logger.info(
    `[CREDITS] Assessment (${update.modelName}): ${creditCost.toFixed(3)} credits (${deductionResult.deductedFromSubscription.toFixed(3)} subscription + ${deductionResult.deductedFromPurchased.toFixed(3)} purchased)`
  );

  return updateUsageRecord(supabase, {
    assessment: updatedAssessment,
    used_subscription_credits:
      current.usedSubscriptionCredits +
      deductionResult.deductedFromSubscription,
    used_purchased_credits:
      current.usedPurchasedCredits + deductionResult.deductedFromPurchased,
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

  // Calculate credit cost and deduct credits
  const creditCost = calculateTextModelCreditCost(update.modelName, {
    cachedTokens: update.promptTokens.text.cached || 0,
    notCachedTokens: update.promptTokens.text.notCached || 0,
    outputTokens: update.outputTokens || 0,
  });

  if (!current) {
    throw new Error("No current usage record found");
  }

  const deductionResult = deductCreditsWithPriority(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditCost
  );

  logger.info(
    `[CREDITS] Prompt Helper (${update.modelName}): ${creditCost.toFixed(3)} credits (${deductionResult.deductedFromSubscription.toFixed(3)} subscription + ${deductionResult.deductedFromPurchased.toFixed(3)} purchased)`
  );

  return updateUsageRecord(supabase, {
    prompt_helper: updatedPromptHelper,
    used_subscription_credits:
      current.usedSubscriptionCredits +
      deductionResult.deductedFromSubscription,
    used_purchased_credits:
      current.usedPurchasedCredits + deductionResult.deductedFromPurchased,
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

  // Calculate credit cost and deduct credits
  const creditCost = calculateImageCreditCost({
    modelName: update.modelName,
    quality: update.quality,
    size: update.size,
    textTokens: {
      cachedTokens: update.promptTokens.text?.cached || 0,
      notCachedTokens: update.promptTokens.text?.notCached || 0,
    },
    imageTokens: {
      cachedTokens: update.promptTokens.image?.cached || 0,
      notCachedTokens: update.promptTokens.image?.notCached || 0,
    },
  });

  if (!current) {
    throw new Error("No current usage record found");
  }

  const deductionResult = deductCreditsWithPriority(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditCost
  );

  logger.info(
    `[CREDITS] Image (${update.modelName} ${update.quality}/${update.size}): ${creditCost.toFixed(3)} credits (${deductionResult.deductedFromSubscription.toFixed(3)} subscription + ${deductionResult.deductedFromPurchased.toFixed(3)} purchased)`
  );

  return updateUsageRecord(supabase, {
    images: updatedImages,
    used_subscription_credits:
      current.usedSubscriptionCredits +
      deductionResult.deductedFromSubscription,
    used_purchased_credits:
      current.usedPurchasedCredits + deductionResult.deductedFromPurchased,
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

  // Calculate credit cost and deduct credits
  const creditCost = calculateConversationCreditCost(update.modelName, {
    textTokens: {
      cachedTokens: update.promptTokens.text?.cached || 0,
      notCachedTokens: update.promptTokens.text?.notCached || 0,
    },
    audioTokens: {
      cachedTokens: update.promptTokens.audio?.cached || 0,
      notCachedTokens: update.promptTokens.audio?.notCached || 0,
    },
    outputTextTokens: update.outputTokens?.text || 0,
    outputAudioTokens: update.outputTokens?.audio || 0,
  });

  if (!current) {
    throw new Error("No current usage record found");
  }

  const deductionResult = deductCreditsWithPriority(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditCost
  );

  logger.info(
    `[CREDITS] Conversation (${update.modelName}): ${creditCost.toFixed(3)} credits (${deductionResult.deductedFromSubscription.toFixed(3)} subscription + ${deductionResult.deductedFromPurchased.toFixed(3)} purchased)`
  );

  return updateUsageRecord(supabase, {
    conversation: updatedConversation,
    used_subscription_credits:
      current.usedSubscriptionCredits +
      deductionResult.deductedFromSubscription,
    used_purchased_credits:
      current.usedPurchasedCredits + deductionResult.deductedFromPurchased,
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

  // Calculate credit cost and deduct credits
  const creditCost = calculateTranscriptionCreditCost({
    sessionLengthMinutes: (update.totalSessionLength || 0) / 60,
  });

  if (!current) {
    throw new Error("No current usage record found");
  }

  const deductionResult = deductCreditsWithPriority(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditCost
  );

  logger.info(
    `[CREDITS] Transcription (${update.modelName}): ${creditCost.toFixed(3)} credits (${deductionResult.deductedFromSubscription.toFixed(3)} subscription + ${deductionResult.deductedFromPurchased.toFixed(3)} purchased)`
  );

  return updateUsageRecord(supabase, {
    transcription: updatedTranscription,
    used_subscription_credits:
      current.usedSubscriptionCredits +
      deductionResult.deductedFromSubscription,
    used_purchased_credits:
      current.usedPurchasedCredits + deductionResult.deductedFromPurchased,
  });
}

// Get usage history for a user
export async function getUserUsageHistory(
  supabase: SupabaseClient,
  limit: number = 12
): Promise<Usage[]> {
  const userId = await getUserId(supabase);

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
    subscription_credits: number;
    used_subscription_credits: number;
    purchased_credits: number;
    used_purchased_credits: number;
  }>
): Promise<Usage> {
  const userId = await getUserId(supabase);

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
    subscriptionCredits: parseFloat(data.subscription_credits) || 0,
    usedSubscriptionCredits: parseFloat(data.used_subscription_credits) || 0,
    purchasedCredits: parseFloat(data.purchased_credits) || 0,
    usedPurchasedCredits: parseFloat(data.used_purchased_credits) || 0,
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
  totalAvailableCredits: number;
  totalUsedCredits: number;
  creditBalance: CreditBalance;
}> {
  const current = await getCurrentUsage(supabase);

  if (!current) {
    const emptyCreditBalance: CreditBalance = {
      subscriptionCredits: 0,
      usedSubscriptionCredits: 0,
      availableSubscriptionCredits: 0,
      purchasedCredits: 0,
      usedPurchasedCredits: 0,
      availablePurchasedCredits: 0,
      totalAvailableCredits: 0,
      totalUsedCredits: 0,
      totalRemainingCredits: 0,
    };
    return {
      hasCredits: false,
      totalAvailableCredits: 0,
      totalUsedCredits: 0,
      creditBalance: emptyCreditBalance,
    };
  }

  return checkSufficientCredits(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits,
    creditsRequired
  );
}

// Add purchased credits to user's current period (these roll over)
export async function addPurchasedCredits(
  supabase: SupabaseClient,
  creditsToAdd: number
): Promise<Usage> {
  const current = await getCurrentUsage(supabase);

  if (!current) {
    throw new Error("No current usage record found");
  }

  return updateUsageRecord(supabase, {
    purchased_credits: current.purchasedCredits + creditsToAdd,
  });
}

// Initialize credits for a new period based on subscription tier
export async function initializePeriodCredits(
  supabase: SupabaseClient,
  subscriptionTier: SubscriptionTier
): Promise<Usage> {
  const userId = await getUserId(supabase);

  // Get or create current usage record
  const { data: usageId, error: rpcError } = await supabase.rpc(
    "get_or_create_current_usage",
    { target_user_id: userId }
  );

  if (rpcError) handleError(rpcError);

  return initializePeriodCreditsInternal(
    supabase,
    userId,
    usageId,
    subscriptionTier
  );
}

// Get current credit balance with detailed breakdown
export async function getCreditBalance(
  supabase: SupabaseClient
): Promise<CreditBalance | null> {
  const current = await getCurrentUsage(supabase);

  if (!current) return null;

  return calculateCreditBalanceLogic(
    current.subscriptionCredits,
    current.usedSubscriptionCredits,
    current.purchasedCredits,
    current.usedPurchasedCredits
  );
}
