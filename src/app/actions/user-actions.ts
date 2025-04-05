"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getCurrentUserInfo,
  updateUserProfile,
  updateUserAvatar,
  updateUserTrial,
} from "@/data/user";
import { z } from "zod";
import { cache } from "react";
import { Invitation } from "@/data/invitations";
const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

export async function getCurrentUserAction() {
  const supabase = await createClient();
  return await getCurrentUserInfo(supabase);
}

export const getCurrentUserActionCached = cache(async () => {
  const supabase = await createClient();
  return await getCurrentUserInfo(supabase);
});

export async function updateProfileAction(data: { displayName: string }) {
  try {
    // Validate input
    const validated = updateProfileSchema.parse(data);

    const supabase = await createClient();
    const updatedUser = await updateUserProfile(
      supabase,
      validated.displayName
    );

    return { success: true, data: updatedUser };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" };
    }
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateAvatarAction(data: { avatarUrl: string }) {
  try {
    // Validate input
    const validated = updateAvatarSchema.parse(data);

    const supabase = await createClient();
    const updatedUser = await updateUserAvatar(supabase, validated.avatarUrl);

    return { success: true, data: updatedUser };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid avatar URL" };
    }
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function startTrialAction(invitation: Invitation) {
  if (!invitation.isTrial) {
    throw new Error("Invitation is not a trial");
  }

  const supabase = await createClient();
  const user = await getCurrentUserInfo(supabase);
  if (user.trialStartDate || user.trialEndDate) {
    throw new Error("User is already on a trial");
  }

  const trialLengthInDays = 30;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + trialLengthInDays * 24 * 60 * 60 * 1000);
  return await updateUserTrial(supabase, startDate, endDate);
}
