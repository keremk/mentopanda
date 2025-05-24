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
  checkCreditAvailability,
  addCredits,
  deductCredits,
  initializePeriodCredits,
  getCreditBalance,
  type Usage,
  type AssessmentUpdate,
  type PromptHelperUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
  type SubscriptionTier,
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

// Credit Management Actions

// Check if user has sufficient credits
export async function checkCreditAvailabilityAction(
  creditsRequired: number
): Promise<{
  hasCredits: boolean;
  availableCredits: number;
  usedCredits: number;
}> {
  const supabase = await createClient();
  return await checkCreditAvailability(supabase, creditsRequired);
}

// Add credits to user's account
export async function addCreditsAction(creditsToAdd: number): Promise<Usage> {
  const supabase = await createClient();
  return await addCredits(supabase, creditsToAdd);
}

// Deduct credits from user's account
export async function deductCreditsAction(
  creditsToDeduct: number
): Promise<Usage> {
  const supabase = await createClient();
  return await deductCredits(supabase, creditsToDeduct);
}

// Initialize credits for a new billing period
export async function initializePeriodCreditsAction(
  subscriptionTier: SubscriptionTier
): Promise<Usage> {
  const supabase = await createClient();
  return await initializePeriodCredits(supabase, subscriptionTier);
}

// Get current credit balance
export async function getCreditBalanceAction(): Promise<{
  availableCredits: number;
  usedCredits: number;
  remainingCredits: number;
} | null> {
  const supabase = await createClient();
  return await getCreditBalance(supabase);
}
