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
  const endDate = new Date(
    startDate.getTime() + trialLengthInDays * 24 * 60 * 60 * 1000
  );
  return await updateUserTrial(supabase, startDate, endDate);
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
    // console.error("Password validation failed:", validated.error.flatten());
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
    console.error("Get User Error:", getUserError);
    return { success: false, error: "Authentication error. Please sign in." };
  }

  // Check provider - this check should ideally prevent calling the action
  // but double-check here for safety.
  if (user.app_metadata?.provider && user.app_metadata.provider !== "email") {
    return { success: false, error: "Cannot update password for OAuth users." };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Update Password Error:", updateError.message);
    return {
      success: false,
      error: `Failed to update password: ${updateError.message}`,
    };
  }

  // Indicate success - client will handle redirect or message
  return { success: true };
  // Optionally redirect server-side:
  // redirect("/login?message=Password updated successfully. Please sign in.");
}
// --- End New Action ---
