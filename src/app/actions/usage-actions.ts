"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getCurrentUsage,
  getUsageByPeriod,
  updateAssessmentUsage,
  updatePromptHelperUsage,
  updateConversationUsage,
  updateTranscriptionUsage,
  updateImageUsage,
  getUserUsageHistory,
  checkCreditAvailability,
  addPurchasedCredits,
  initializePeriodCredits,
  getCreditBalance,
  type Usage,
  type AssessmentUpdate,
  type PromptHelperUpdate,
  type ImageUpdate,
  type ConversationUpdate,
  type TranscriptionUpdate,
} from "@/data/usage";
import { type SubscriptionTier, type CreditBalance } from "@/lib/usage/types";

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

// Update Replicate image usage
export async function updateImageUsageAction(
  update: ImageUpdate
): Promise<Usage> {
  const supabase = await createClient();
  return await updateImageUsage(supabase, update);
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
  totalAvailableCredits: number;
  totalUsedCredits: number;
  creditBalance: CreditBalance;
}> {
  const supabase = await createClient();
  return await checkCreditAvailability(supabase, creditsRequired);
}

// Add purchased credits to user's account (these roll over between periods)
export async function addPurchasedCreditsAction(
  creditsToAdd: number
): Promise<Usage> {
  const supabase = await createClient();
  return await addPurchasedCredits(supabase, creditsToAdd);
}

// Initialize credits for a new billing period
export async function initializePeriodCreditsAction(
  subscriptionTier: SubscriptionTier
): Promise<Usage> {
  const supabase = await createClient();
  return await initializePeriodCredits(supabase, subscriptionTier);
}

// Get current credit balance with detailed breakdown
export async function getCreditBalanceAction(): Promise<CreditBalance | null> {
  const supabase = await createClient();
  return await getCreditBalance(supabase);
}
