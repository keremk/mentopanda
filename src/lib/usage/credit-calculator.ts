import pricingData from "@/data/pricing.json";
import {
  CREDIT_CONFIG,
  IMAGE_CONFIG,
  type TokenUsage,
  type AudioTokenUsage,
  type ImageGenerationParams,
  type TranscriptionParams,
} from "./types";

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
  quality: string,
  size: string
): number {
  const dimensions =
    IMAGE_CONFIG.ASPECT_RATIO_TO_DIMENSIONS[
      size as keyof typeof IMAGE_CONFIG.ASPECT_RATIO_TO_DIMENSIONS
    ];
  return (
    (
      pricingData.image_generation as Record<
        string,
        Record<string, Record<string, number>>
      >
    )[modelName]?.[quality]?.[dimensions] || 0
  );
}

// Get transcription pricing (per minute)
function getTranscriptionPricing(): number {
  return pricingData.whisper.transcription_per_minute;
}

// Get image token pricing (per 1M tokens)
function getImageTokenPricing(
  modelName: string
): { input: number; cachedInput: number; output: number } | null {
  const model = pricingData.image_tokens.find((m) => m.model === modelName);
  if (!model) return null;

  return {
    input: model.input / 1_000_000, // Convert from per 1M to per token
    cachedInput: (model.cached_input || model.input) / 1_000_000,
    output: model.output / 1_000_000,
  };
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

// Pure credit calculation functions

export function calculateTextModelCreditCost(
  modelName: string,
  tokenUsage: TokenUsage
): number {
  const pricing = getTextModelPricing(modelName);

  if (!pricing) {
    return 0;
  }

  const cachedTokens = tokenUsage.cachedTokens || 0;
  const notCachedTokens = tokenUsage.notCachedTokens || 0;
  const outputTokens = tokenUsage.outputTokens || 0;

  const costUSD =
    cachedTokens * pricing.cachedInput +
    notCachedTokens * pricing.input +
    outputTokens * pricing.output;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateImageCreditCost(
  params: ImageGenerationParams
): number {
  let totalCostUSD = 0;

  // 1. Image generation cost (based on quality and size)
  const imageGenerationCost = getImagePricing(
    params.modelName,
    params.quality,
    params.size
  );
  totalCostUSD += imageGenerationCost;

  // 2. Input token processing costs (if any tokens are provided)
  if (params.textTokens || params.imageTokens) {
    const imageTokenPricing = getImageTokenPricing(params.modelName);

    if (imageTokenPricing) {
      // Text tokens in the prompt
      if (params.textTokens) {
        const cachedTokens = params.textTokens.cachedTokens || 0;
        const notCachedTokens = params.textTokens.notCachedTokens || 0;
        totalCostUSD +=
          cachedTokens * imageTokenPricing.cachedInput +
          notCachedTokens * imageTokenPricing.input;
      }

      // Image tokens in the prompt
      if (params.imageTokens) {
        const cachedTokens = params.imageTokens.cachedTokens || 0;
        const notCachedTokens = params.imageTokens.notCachedTokens || 0;
        totalCostUSD +=
          cachedTokens * imageTokenPricing.cachedInput +
          notCachedTokens * imageTokenPricing.input;
      }
    }
  }

  // Note: outputTokens are ignored as per pricing structure

  return calculateCreditsFromUSD(totalCostUSD);
}

export function calculateConversationCreditCost(
  modelName: string,
  audioUsage: AudioTokenUsage
): number {
  const pricing = getRealtimePricing(modelName);

  if (!pricing) {
    return 0;
  }

  const textCachedTokens = audioUsage.textTokens.cachedTokens || 0;
  const textNotCachedTokens = audioUsage.textTokens.notCachedTokens || 0;
  const audioCachedTokens = audioUsage.audioTokens.cachedTokens || 0;
  const audioNotCachedTokens = audioUsage.audioTokens.notCachedTokens || 0;
  const outputTextTokens = audioUsage.outputTextTokens || 0;
  const outputAudioTokens = audioUsage.outputAudioTokens || 0;

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
  params: TranscriptionParams
): number {
  const costPerMinute = getTranscriptionPricing();
  const costUSD = params.sessionLengthMinutes * costPerMinute;

  return calculateCreditsFromUSD(costUSD);
}
