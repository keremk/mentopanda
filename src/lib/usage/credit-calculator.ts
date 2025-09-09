import { MODEL_NAMES } from "@/types/models";
import {
  CREDIT_CONFIG,
  type TokenUsage,
  type RealtimeTokenUsage,
  type TranscriptionTokenUsage,
} from "./types";

type TokenPricing = {
  input: number;
  cachedInput: number;
  output: number;
};

type RealtimePricing = {
  text: TokenPricing;
  audio: TokenPricing;
};

type GenerationPricing = {
  costPerGeneration: number;
};

type TranscriptionPricing = {
  text: TokenPricing;
  audio: TokenPricing;
};

type PricingMap = {
  [key: string]:
    | TokenPricing
    | RealtimePricing
    | GenerationPricing
    | TranscriptionPricing;
};

// Pricing data for text models (per 1M tokens)
const MODEL_PRICING: PricingMap = {
  [MODEL_NAMES.OPENAI_REALTIME]: {
    text: {
      input: 4.0,
      cachedInput: 0.4,
      output: 16.0,
    },
    audio: {
      input: 32.0,
      cachedInput: 0.4,
      output: 64.0,
    },
  },
  [MODEL_NAMES.OPENAI_GPT4O]: {
    input: 2.5,
    cachedInput: 1.25,
    output: 10.0,
  },
  [MODEL_NAMES.OPENAI_GPT5]: {
    input: 1.25,
    cachedInput: 0.125,
    output: 10.0,
  },
  [MODEL_NAMES.OPENAI_GPT5_CHAT]: {
    input: 1.25,
    cachedInput: 0.125,
    output: 10.0,
  },
  [MODEL_NAMES.OPENAI_TRANSCRIBE]: {
    text: {
      input: 2.5,
      cachedInput: 0.0,
      output: 10.0,
    },
    audio: {
      input: 6.0,
      cachedInput: 0.0,
      output: 0.0,
    },
  },
  [MODEL_NAMES.REPLICATE_IMAGEN_FAST]: {
    costPerGeneration: 0.02,
  },
} as const;

const MILLION_TOKENS = 1_000_000;

// Helper function to calculate credits from USD cost
function calculateCreditsFromUSD(costUSD: number): number {
  return (
    (costUSD * CREDIT_CONFIG.MARGIN_MULTIPLIER) / CREDIT_CONFIG.CREDIT_VALUE_USD
  );
}

// Pure credit calculation functions

export function calculateTextModelCreditCost(
  modelName: string,
  tokenUsage: TokenUsage
): number {
  const pricing = MODEL_PRICING[
    modelName as keyof typeof MODEL_PRICING
  ] as TokenPricing;
  if (!pricing) throw Error(`Token pricing for ${modelName} is missing!`);

  const cachedTokens = tokenUsage.cachedTokens || 0;
  const notCachedTokens = tokenUsage.notCachedTokens || 0;
  const outputTokens = tokenUsage.outputTokens || 0;

  const costUSD =
    (cachedTokens * pricing.cachedInput) / MILLION_TOKENS +
    (notCachedTokens * pricing.input) / MILLION_TOKENS +
    (outputTokens * pricing.output) / MILLION_TOKENS;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateConversationCreditCost(
  modelName: string,
  tokenUsage: RealtimeTokenUsage
): number {
  const pricing = MODEL_PRICING[
    modelName as keyof typeof MODEL_PRICING
  ] as RealtimePricing;

  if (!pricing)
    throw Error(`Realtime conversation pricing for ${modelName} is missing!`);

  const textCachedTokens = tokenUsage.textTokens.cachedTokens || 0;
  const textNotCachedTokens = tokenUsage.textTokens.notCachedTokens || 0;
  const audioCachedTokens = tokenUsage.audioTokens.cachedTokens || 0;
  const audioNotCachedTokens = tokenUsage.audioTokens.notCachedTokens || 0;
  const outputTextTokens = tokenUsage.outputTextTokens || 0;
  const outputAudioTokens = tokenUsage.outputAudioTokens || 0;

  const costUSD =
    (textCachedTokens * pricing.text.cachedInput +
      textNotCachedTokens * pricing.text.input +
      audioCachedTokens * pricing.audio.cachedInput +
      audioNotCachedTokens * pricing.audio.input +
      outputTextTokens * pricing.text.output +
      outputAudioTokens * pricing.audio.output) /
    MILLION_TOKENS;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateTranscriptionTokenCreditCost(
  modelName: string,
  tokenUsage: TranscriptionTokenUsage
): number {
  const pricing = MODEL_PRICING[
    modelName as keyof typeof MODEL_PRICING
  ] as TranscriptionPricing;

  if (!pricing)
    throw Error(`Transcription pricing for ${modelName} is missing!`);

  const costUSD = (tokenUsage.inputAudioTokens * pricing.audio.input +
    tokenUsage.inputTextTokens * pricing.text.input +
    tokenUsage.outputTokens * pricing.text.output) / MILLION_TOKENS;

  return calculateCreditsFromUSD(costUSD);
}

export function calculateReplicateImageCreditCost(
  modelName: string,
  imageCount: number
): number {
  const pricing = MODEL_PRICING[
    modelName as keyof typeof MODEL_PRICING
  ] as GenerationPricing;
  if (!pricing) throw Error(`Replicate pricing for ${modelName} is missing!`);

  const totalCostUSD = imageCount * pricing.costPerGeneration;

  return calculateCreditsFromUSD(totalCostUSD);
}
