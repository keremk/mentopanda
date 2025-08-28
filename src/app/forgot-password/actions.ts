"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { z } from 'zod/v3';
import { logger } from "@/lib/logger";
const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export type State = {
  message?: string;
  success?: boolean;
  errors?: {
    email?: string[];
  };
};

export async function requestPasswordReset(
  prevState: State,
  formData: FormData
): Promise<State> {
  // Await headers() and then get the origin
  const headersList = await headers(); // Explicitly await
  const origin = headersList.get("origin");

  const validatedFields = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  // Return validation errors
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid email provided.",
      success: false,
    };
  }

  const { email } = validatedFields.data;

  // Create Supabase client - Await as it seems async in this project
  const supabase = await createClient();

  // Construct the redirect URL for Supabase.
  // It should point to your auth callback route.
  // Supabase will append tokens/codes and then redirect
  // back to the `next` path after successful verification.
  const redirectUrl = `${origin}/auth/callback?next=/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  // Always return a generic success message to prevent email enumeration
  // Log the actual error server-side if needed for debugging
  if (error) {
    logger.error("Password Reset Error:", error.message);
    // Optionally redirect to the same page with a generic success message
    // Or just return the success state
  }

  // Consider redirecting to the same page with a success query param
  // Or just returning a success state for the form hook to handle
  // redirect(`/forgot-password?message=Password reset instructions sent.`);
  return {
    message:
      "If an account exists for this email, password reset instructions have been sent.",
    success: true,
  };
}
