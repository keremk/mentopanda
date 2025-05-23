"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getCurrentUsage,
  getUsageByPeriod,
  updateAssessmentUsage,
  updatePromptHelperUsage,
  updateImageUsage,
  updateConversationUsage,
  updateTranscriptionUsage,
  getUserUsageHistory,
  type Usage,
  type AssessmentUpdate,
  type PromptHelperUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
} from "@/data/usage";

// Get current usage period for the authenticated user
export async function getCurrentUsageAction(): Promise<Usage | null> {
  const supabase = await createClient();
  return await getCurrentUsage(supabase);
}

// Get usage for a specific period
export async function getUsageByPeriodAction(
  periodStart: Date
): Promise<Usage | null> {
  const supabase = await createClient();
  return await getUsageByPeriod(supabase, periodStart);
}

// Update assessment usage
export async function updateAssessmentUsageAction(
  update: AssessmentUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updateAssessmentUsage(supabase, update);
}

// Update prompt helper usage
export async function updatePromptHelperUsageAction(
  update: PromptHelperUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updatePromptHelperUsage(supabase, update);
}

// Update image usage
export async function updateImageUsageAction(
  update: ImageUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updateImageUsage(supabase, update);
}

// Update conversation usage
export async function updateConversationUsageAction(
  update: ConversationUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updateConversationUsage(supabase, update);
}

// Update transcription usage
export async function updateTranscriptionUsageAction(
  update: TranscriptionUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updateTranscriptionUsage(supabase, update);
}

// Get usage history for a user
export async function getUserUsageHistoryAction(
  limit: number = 12
): Promise<Usage[]> {
  const supabase = await createClient();
  return await getUserUsageHistory(supabase, limit);
}
