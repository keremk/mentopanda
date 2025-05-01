"use server";

import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // For admin client

type ActionResult = { success: boolean; error?: string };

const deleteSchema = z.object({
  bucketName: z.string().min(1, "Bucket name is required."),
  path: z.string().min(1, "Path is required."),
});

export async function deleteStorageObjectAction(
  input: unknown
): Promise<ActionResult> {
  // Validate input
  const validationResult = deleteSchema.safeParse(input);
  if (!validationResult.success) {
    const errorMsg = validationResult.error.flatten().formErrors.join(", ");
    console.error("Invalid input for deleteStorageObjectAction:", errorMsg);
    return { success: false, error: `Invalid input: ${errorMsg}` };
  }

  const { bucketName, path } = validationResult.data;

  // Use Admin Client for robust deletion (bypasses RLS)
  // Ensure these ENV vars are set in your deployment
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Missing Supabase URL or Service Role Key for admin client.");
    return { success: false, error: "Server configuration error." };
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log(`Attempting to delete object: ${bucketName}/${path}`);

  try {
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      // Don't treat "Not Found" as a fatal error for cleanup
      if (error.message.includes("Not Found")) {
        console.warn(
          `Object not found for deletion (ignoring): ${bucketName}/${path}`
        );
        return { success: true }; // Considered success as the object is gone
      }
      console.error(
        `Supabase storage deletion error: ${error.message} for ${bucketName}/${path}`
      );
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`,
      };
    }

    console.log(`Successfully deleted object: ${bucketName}/${path}`);
    return { success: true };
  } catch (err) {
    console.error("Unexpected error during storage deletion:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return {
      success: false,
      error: `Unexpected server error during deletion: ${errorMessage}`,
    };
  }
}
