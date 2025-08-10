"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getCurrentUserInfo,
  updateUserProfile,
  updateUserAvatar,
  updateUserOnboardingStatus,
  checkOnboardingStatus,
  OnboardingStatus,
} from "@/data/user";
import { z } from "zod";
import { cache } from "react";
import { logger } from "@/lib/logger";

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url(),
});

const updateOnboardingSchema = z.object({
  onboarding: z.enum(["not_started", "complete"]),
});

// New schema for password update
const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Apply error to confirm password field
  });

export async function getCurrentUserAction() {
  const supabase = await createClient();
  return await getCurrentUserInfo(supabase);
}

export const getCurrentUserActionCached = cache(async () => {
  const supabase = await createClient();
  return await getCurrentUserInfo(supabase);
});

export const getCurrentUserOrNullActionCached = cache(async () => {
  try {
    const supabase = await createClient();
    return await getCurrentUserInfo(supabase);
  } catch {
    // User is not authenticated - return null for anonymous users
    return null;
  }
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
    logger.error("Error updating profile:", error);
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
    logger.error("Error updating avatar:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid avatar URL" };
    }
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function updateOnboardingStatusAction(data: {
  onboarding: OnboardingStatus;
}) {
  try {
    // Validate input
    const validated = updateOnboardingSchema.parse(data);

    const supabase = await createClient();
    const updatedUser = await updateUserOnboardingStatus(
      supabase,
      validated.onboarding
    );

    return { success: true, data: updatedUser };
  } catch (error) {
    logger.error("Error updating onboarding status:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid onboarding status" };
    }
    return { success: false, error: "Failed to update onboarding status" };
  }
}

/**
 * Get the onboarding status of a user
 */
export async function checkOnboardingStatusAction(
  userId: string
): Promise<OnboardingStatus | null> {
  try {
    const supabase = await createClient();
    return await checkOnboardingStatus(supabase, userId);
  } catch (error) {
    logger.error("Error checking onboarding status:", error);
    return null;
  }
}

// --- New Password Update Action ---
export async function updatePasswordAction(formData: FormData) {
  const rawData = {
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = updatePasswordSchema.safeParse(rawData);

  if (!validated.success) {
    // Log detailed validation errors server-side if needed
    logger.error("Password validation failed:", validated.error.flatten());
    // Return a generic error or specific field errors
    return {
      success: false,
      error:
        validated.error.flatten().fieldErrors.confirmPassword?.[0] ||
        validated.error.flatten().fieldErrors.newPassword?.[0] ||
        "Invalid password data.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { newPassword } = validated.data;
  const supabase = await createClient();

  // Get current user to ensure session is valid
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    logger.error("Get User Error:", getUserError);
    return { success: false, error: "Authentication error. Please sign in." };
  }

  // Check provider - this check should ideally prevent calling the action
  // but double-check here for safety.
  if (user.app_metadata?.provider && user.app_metadata.provider !== "email") {
    logger.error("Cannot update password for OAuth users.");
    return { success: false, error: "Cannot update password for OAuth users." };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    logger.error("Update Password Error:", updateError.message);
    return {
      success: false,
      error: `Failed to update password: ${updateError.message}`,
    };
  }

  // Indicate success - client will handle redirect or message
  return { success: true };
}
