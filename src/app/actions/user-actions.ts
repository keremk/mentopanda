"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUserInfo, updateUserProfile } from "@/data/user";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  organizationName: z.string().min(2).max(100),
});

export async function getCurrentUserAction({
  includeOrgInfo = false,
}: { includeOrgInfo?: boolean } = {}) {
  const supabase = createClient();
  return await getCurrentUserInfo({ supabase, includeOrgInfo });
}

export async function updateProfileAction(data: {
  displayName: string;
  organizationName: string;
}) {
  try {
    // Validate input
    const validated = updateProfileSchema.parse(data);

    const supabase = createClient();
    const updatedUser = await updateUserProfile({
      supabase,
      displayName: validated.displayName,
      organizationName: validated.organizationName,
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input data" };
    }
    return { success: false, error: "Failed to update profile" };
  }
}
