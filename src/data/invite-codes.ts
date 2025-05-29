import type { SupabaseClient } from "@supabase/supabase-js";
import { generateInviteCode } from "@/lib/invite-code-generator";
import { logger } from "@/lib/logger";

export type InviteCode = {
  id: number;
  code: string;
  created_by: string;
  created_at: string;
  expire_by: number;
  validated: boolean;
  created_for: string | null;
};

export type CreateInviteCodeParams = {
  code?: string; // Now optional - will be generated if not provided
  expire_by?: number;
  created_for?: string | null;
  codeLength?: number; // New option for code length
};

export type ValidateInviteCodeResult = {
  isValid: boolean;
  inviteCode?: InviteCode;
  reason?: "not_found" | "expired" | "already_validated" | "error";
  message?: string;
};

/**
 * Create a new invite code
 */
export async function createInviteCode(
  supabase: SupabaseClient,
  params: CreateInviteCodeParams
): Promise<InviteCode> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      // Generate code if not provided
      const code = params.code || generateInviteCode(params.codeLength || 10);

      const { data, error } = await supabase
        .from("invite_codes")
        .insert({
          code: code,
          created_by: user.user.id,
          expire_by: params.expire_by ?? 5,
          created_for: params.created_for ?? null,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate code error
        if (
          error.code === "23505" &&
          error.message.includes("invite_codes_code_key")
        ) {
          retryCount++;
          if (retryCount <= maxRetries) {
            logger.info(
              `Duplicate invite code generated, retrying (attempt ${retryCount}/${maxRetries})`,
              {
                code,
                userId: user.user.id,
              }
            );
            continue; // Try again with a new code
          }
        }
        throw new Error(`Failed to create invite code: ${error.message}`);
      }

      // Success
      if (retryCount > 0) {
        logger.info(
          `Successfully created invite code after ${retryCount} retries`,
          {
            finalCode: data.code,
            userId: user.user.id,
          }
        );
      }

      return data;
    } catch (error) {
      if (retryCount >= maxRetries) {
        throw error;
      }
      retryCount++;
    }
  }

  throw new Error("Failed to create invite code after maximum retries");
}

/**
 * Get all invite codes created by the current user
 */
export async function getInviteCodesByUser(
  supabase: SupabaseClient
): Promise<InviteCode[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("created_by", user.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch invite codes: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific invite code by ID (only if created by current user)
 */
export async function getInviteCodeById(
  supabase: SupabaseClient,
  id: number
): Promise<InviteCode | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("id", id)
    .eq("created_by", user.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch invite code: ${error.message}`);
  }

  return data;
}

/**
 * Delete an invite code (only if created by current user)
 */
export async function deleteInviteCode(
  supabase: SupabaseClient,
  id: number
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("invite_codes")
    .delete()
    .eq("id", id)
    .eq("created_by", user.user.id);

  if (error) {
    throw new Error(`Failed to delete invite code: ${error.message}`);
  }
}

/**
 * Validate an invite code and mark it as validated if valid
 * This function uses a SECURITY DEFINER SQL function to bypass RLS
 */
export async function validateInviteCode(
  supabase: SupabaseClient,
  code: string
): Promise<ValidateInviteCodeResult> {
  const { data, error } = await supabase.rpc("validate_invite_code", {
    code_to_validate: code,
  });

  if (error) {
    throw new Error(`Failed to validate invite code: ${error.message}`);
  }

  if (!data) {
    return {
      isValid: false,
      reason: "error",
      message: "No response from validation function",
    };
  }

  // The SQL function returns JSON, parse the result
  const result = typeof data === "string" ? JSON.parse(data) : data;

  return {
    isValid: result.isValid,
    inviteCode: result.inviteCode,
    reason: result.reason,
    message: result.message,
  };
}

/**
 * Get an invite code by code string (for validation purposes)
 * This function uses a SECURITY DEFINER SQL function to bypass RLS
 */
export async function getInviteCodeByCode(
  supabase: SupabaseClient,
  code: string
): Promise<InviteCode | null> {
  const { data, error } = await supabase.rpc("get_invite_code_by_code", {
    code_to_find: code,
  });

  if (error) {
    throw new Error(`Failed to fetch invite code: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // The SQL function returns JSON, parse the result
  return typeof data === "string" ? JSON.parse(data) : data;
}
