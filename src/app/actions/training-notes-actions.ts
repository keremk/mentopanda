"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTrainingNote,
  createTrainingNote,
  updateTrainingNote,
  deleteTrainingNote,
  upsertTrainingNote,
  appendToDraft,
  resetDraft,
  type TrainingNote,
  type CreateTrainingNoteInput,
  type UpdateTrainingNoteInput,
} from "@/data/training-notes";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { checkUserHasCredits } from "./credit-check";

const createTrainingNoteSchema = z.object({
  moduleId: z.number().int().positive(),
  notes: z.string().nullable(),
});

const updateTrainingNoteSchema = z.object({
  moduleId: z.number().int().positive(),
  notes: z.string().nullable(),
});

const moduleIdSchema = z.number().int().positive();

export async function getTrainingNoteAction(
  moduleId: number
): Promise<TrainingNote | null> {
  try {
    const validated = moduleIdSchema.parse(moduleId);
    const supabase = await createClient();

    return await getTrainingNote(supabase, validated);
  } catch (error) {
    logger.error("Failed to get training note", error);
    throw new Error("Failed to get training note");
  }
}

export async function createTrainingNoteAction(
  input: CreateTrainingNoteInput
): Promise<TrainingNote> {
  try {
    const validated = createTrainingNoteSchema.parse(input);
    const supabase = await createClient();

    return await createTrainingNote(supabase, validated);
  } catch (error) {
    logger.error("Failed to create training note", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid training note data");
    }
    throw new Error("Failed to create training note");
  }
}

export async function updateTrainingNoteAction(
  input: UpdateTrainingNoteInput
): Promise<TrainingNote> {
  try {
    const validated = updateTrainingNoteSchema.parse(input);
    const supabase = await createClient();

    return await updateTrainingNote(supabase, validated);
  } catch (error) {
    logger.error("Failed to update training note", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid training note data");
    }
    throw new Error("Failed to update training note");
  }
}

export async function deleteTrainingNoteAction(
  moduleId: number
): Promise<void> {
  try {
    const validated = moduleIdSchema.parse(moduleId);
    const supabase = await createClient();

    await deleteTrainingNote(supabase, validated);
  } catch (error) {
    logger.error("Failed to delete training note", error);
    throw new Error("Failed to delete training note");
  }
}

export async function upsertTrainingNoteAction(
  input: UpdateTrainingNoteInput
): Promise<TrainingNote> {
  try {
    const validated = updateTrainingNoteSchema.parse(input);
    const supabase = await createClient();

    return await upsertTrainingNote(supabase, validated);
  } catch (error) {
    logger.error("Failed to upsert training note", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid training note data");
    }
    throw new Error("Failed to upsert training note");
  }
}

const appendToDraftSchema = z.object({
  moduleId: z.number().int().positive(),
  draftContent: z.string().min(1),
});

export async function appendToDraftAction(
  moduleId: number,
  draftContent: string
): Promise<TrainingNote> {
  try {
    const validated = appendToDraftSchema.parse({ moduleId, draftContent });
    const supabase = await createClient();

    return await appendToDraft(
      supabase,
      validated.moduleId,
      validated.draftContent
    );
  } catch (error) {
    logger.error("Failed to append to draft", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid draft data");
    }
    throw new Error("Failed to append to draft");
  }
}

export async function resetDraftAction(
  moduleId: number
): Promise<TrainingNote | null> {
  try {
    const validated = moduleIdSchema.parse(moduleId);
    const supabase = await createClient();

    return await resetDraft(supabase, validated);
  } catch (error) {
    logger.error("Failed to reset draft", error);
    throw new Error("Failed to reset draft");
  }
}

export async function generateNotesFromDraftAction(
  moduleId: number
): Promise<TrainingNote> {
  try {
    const validated = moduleIdSchema.parse(moduleId);

    // Check if user has sufficient credits before proceeding
    const creditCheck = await checkUserHasCredits();
    if (!creditCheck.hasCredits) {
      logger.warn("Notes generation blocked due to insufficient credits");
      throw new Error(creditCheck.error || "No credits available");
    }

    const supabase = await createClient();

    // Get the current training note with draft content
    const currentNote = await getTrainingNote(supabase, validated);
    if (!currentNote || !currentNote.draft) {
      throw new Error("No draft content found to generate notes from");
    }

    // Use OpenAI to generate organized notes from the draft
    const { generateText } = await import("ai");
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { MODEL_NAMES } = await import("@/types/models");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const openai = createOpenAI({
      apiKey,
      compatibility: "strict",
    });

    const prompt = `You are an expert note-taking assistant. Please organize and refine the following draft training notes into well-structured, clear, and actionable notes. 

The notes should be:
- Well-organized with clear sections
- Easy to read and understand
- Actionable and practical
- Professional in tone
- Formatted in markdown

Here are the draft notes to refine:

${currentNote.draft}

Please create organized, final notes:`;

    const result = await generateText({
      model: openai.chat(MODEL_NAMES.OPENAI_GPT4O),
      prompt: prompt,
      temperature: 0.3,
    });

    // Update the training note with the generated content and clear the draft
    const updatedNote = await updateTrainingNote(supabase, {
      moduleId: validated,
      notes: result.text,
    });

    // Clear the draft after successful note generation
    await resetDraft(supabase, validated);

    return updatedNote;
  } catch (error) {
    logger.error("Failed to generate notes from draft", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid module ID");
    }
    throw new Error("Failed to generate notes from draft");
  }
}
