import { z } from "zod";

export const AI_MODELS = {
  OPENAI: "openai",
  GEMINI: "gemini",
} as const;

export const CURRENT_MODEL_NAMES = {
  OPENAI: "gpt-4o-realtime-preview-2024-12-17",
  GEMINI: "gemini-2.0-flash-exp",
} as const;

export type Voice = {
  name: string;
  voice: string;
  sampleUrl: string | null;
};

// The name field will remain stable as it is persisted in the database. The voice field is the name of the voice in the OpenAI and Gemini APIs which may change.
export const VOICES: Record<AIModel, Voice[]> = {
  [AI_MODELS.OPENAI]: [
    { name: "Alloy", voice: "Alloy", sampleUrl: null },
    { name: "Ash", voice: "Ash", sampleUrl: null },
    { name: "Ballad", voice: "Ballad", sampleUrl: null },
    { name: "Coral", voice: "Coral", sampleUrl: null },
    { name: "Echo", voice: "Echo", sampleUrl: null },
    { name: "Sage", voice: "Sage", sampleUrl: null },
    { name: "Shimmer", voice: "Shimmer", sampleUrl: null },
    { name: "Verse", voice: "Verse", sampleUrl: null },
  ],
  [AI_MODELS.GEMINI]: [
    { name: "Aoede", voice: "Aoede", sampleUrl: "/voices/Aoede.wav" },
    { name: "Fenrir", voice: "Fenrir", sampleUrl: "/voices/Fenrir.wav" },
    { name: "Kore", voice: "Kore", sampleUrl: "/voices/Kore.wav" },
    { name: "Charon", voice: "Charon", sampleUrl: "/voices/Charon.wav" },
    { name: "Puck", voice: "Puck", sampleUrl: "/voices/Puck.wav" },
  ],
} as const;


// Fix: Convert Object.values to a tuple type using as const
export const aiModelSchema = z.enum(
  Object.values(AI_MODELS) as [string, ...string[]]
);

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
