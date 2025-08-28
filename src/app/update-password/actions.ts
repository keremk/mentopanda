"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { z } from 'zod/v3';
import { logger } from "@/lib/logger";

// Schema for password validation
const UpdatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Error path for mismatch
  });

export type State = {
  message?: string;
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function updatePassword(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = UpdatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  // Return validation errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid data provided.",
    };
  }

  const { password } = validatedFields.data;
  const supabase = await createClient();

  // Check if user is authenticated (should be, via the reset link flow)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This shouldn't happen if the flow is correct, but handle it defensively
    logger.error("User not found in update password action");
    return redirect("/login?message=Authentication required. Please sign in.");
  }

  // Update the user's password
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    logger.error("Update Password Error:", error.message);
    return {
      message: `Error updating password: ${error.message}. Please try again.`,
    };
  }

  // Password updated successfully, redirect to login with a success message
  // Important: Sign out the user after password update for security
  await supabase.auth.signOut();
  return redirect(
    "/login?message=Password updated successfully! Please sign in."
  );
}
