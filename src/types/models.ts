import { z } from 'zod/v3';

export const AI_MODELS = {
  OPENAI: "openai",
  GEMINI: "gemini",
} as const;

// Latest model names with versions
export const CURRENT_MODEL_NAMES = {
  OPENAI: "gpt-realtime",
  GEMINI: "gemini-2.0-flash-exp",
} as const;

// Model names without versions - used in pricing calculations
export const MODEL_NAMES = {
  OPENAI_REALTIME: "gpt-realtime",
  OPENAI_WHISPER: "whisper-1",
  OPENAI_TRANSCRIBE: "gpt-4o-transcribe", // Better transcription model
  OPENAI_GPT4O: "gpt-4o",
  OPENAI_GPT41: "gpt-4.1",
  OPENAI_O3: "o3",
  OPENAI_GPT_IMAGE: "gpt-image-1",
  GEMINI: "gemini-2.0-flash-exp",
} as const;

export type Voice = {
  name: string;
  voice: string;
  sampleUrl: string | null;
  avatarUrl?: string;
};

// The name field will remain stable as it is persisted in the database. The voice field is the name of the voice in the OpenAI and Gemini APIs which may change.
export const VOICES: Record<AIModel, Voice[]> = {
  [AI_MODELS.OPENAI]: [
    {
      name: "Alloy",
      voice: "alloy",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/alloy.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/alloy.png",
    },
    {
      name: "Ash",
      voice: "ash",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/ash.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/ash.png",
    },
    {
      name: "Ballad",
      voice: "ballad",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/ballad.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/ballad.png",
    },
    {
      name: "Coral",
      voice: "coral",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/coral.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/coral.png",
    },
    {
      name: "Echo",
      voice: "echo",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/echo.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/echo.png",
    },
    {
      name: "Sage",
      voice: "sage",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/sage.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/sage.png",
    },
    {
      name: "Shimmer",
      voice: "shimmer",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/shimmer.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/shimmer.png",
    },
    {
      name: "Verse",
      voice: "verse",
      sampleUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/voices/verse.ogg",
      avatarUrl:
        "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/avatars/sidequest-avatars/verse.png",
    },
  ],
  [AI_MODELS.GEMINI]: [
    { name: "Aoede", voice: "Aoede", sampleUrl: "/voices/Aoede.wav" },
    { name: "Fenrir", voice: "Fenrir", sampleUrl: "/voices/Fenrir.wav" },
    { name: "Kore", voice: "Kore", sampleUrl: "/voices/Kore.wav" },
    { name: "Charon", voice: "Charon", sampleUrl: "/voices/Charon.wav" },
    { name: "Puck", voice: "Puck", sampleUrl: "/voices/Puck.wav" },
  ],
} as const;

export const DEFAULT_VOICE = VOICES[AI_MODELS.OPENAI][0].voice;

// Fix: Convert Object.values to a tuple type using as const
export const aiModelSchema = z.enum(
  Object.values(AI_MODELS) as [string, ...string[]]
);

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
