import { z } from "zod";

export const AI_MODELS = {
  OPENAI_REALTIME: "gpt-4o-realtime",
  GEMINI_FLASH: "gemini-2.0-flash-exp",
} as const;

// Fix: Convert Object.values to a tuple type using as const
export const aiModelSchema = z.enum(
  Object.values(AI_MODELS) as [string, ...string[]]
);

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
