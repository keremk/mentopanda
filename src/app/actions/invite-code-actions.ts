"use server";

import {
  createInviteCode,
  getInviteCodesByUser,
  getInviteCodeById,
  deleteInviteCode,
  validateInviteCode,
  getInviteCodeByCode,
  type InviteCode,
  type CreateInviteCodeParams,
  type ValidateInviteCodeResult,
} from "@/data/invite-codes";
import { createClient } from "@/utils/supabase/server";
import { z } from 'zod/v3';
import { logger } from "@/lib/logger";
import { cookies } from "next/headers";

const createInviteCodeSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  expire_by: z.number().min(1, "Expiry days must be at least 1").optional(),
  created_for: z.string().nullable().optional(),
  codeLength: z.number().min(6).max(16).optional(),
});

const validateInviteCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

const createInviteCodesSchema = z.object({
  createdFor: z.string().optional(),
  quantity: z.number().min(1).max(50),
  expireInDays: z.number().min(1).max(365),
});

/**
 * Create a new invite code
 */
export async function createInviteCodeAction(
  params: CreateInviteCodeParams = {}
): Promise<InviteCode> {
  try {
    const validated = createInviteCodeSchema.parse(params);
    const supabase = await createClient();

    return await createInviteCode(supabase, validated);
  } catch (error) {
    logger.error("Failed to create invite code", error);
    throw new Error("Failed to create invite code");
  }
}

/**
 * Create multiple invite codes
 */
export async function createInviteCodesAction(
  createdFor: string | undefined,
  quantity: number,
  expireInDays: number
): Promise<InviteCode[]> {
  const supabase = await createClient();

  const validated = createInviteCodesSchema.parse({
    createdFor,
    quantity,
    expireInDays,
  });

  try {
    const codes: InviteCode[] = [];

    for (let i = 0; i < validated.quantity; i++) {
      const params: CreateInviteCodeParams = {
        expire_by: validated.expireInDays,
        created_for: validated.createdFor || null,
      };

      const code = await createInviteCode(supabase, params);
      codes.push(code);
    }

    return codes;
  } catch (error) {
    logger.error("Failed to create invite codes", error);
    throw new Error("Failed to create invite codes");
  }
}

/**
 * Get all invite codes for the current user
 */
export async function getInviteCodesAction(): Promise<InviteCode[]> {
  const supabase = await createClient();

  try {
    return await getInviteCodesByUser(supabase);
  } catch (error) {
    logger.error("Failed to fetch invite codes", error);
    throw new Error("Failed to fetch invite codes");
  }
}

/**
 * Get a specific invite code by ID
 */
export async function getInviteCodeAction(
  id: number
): Promise<InviteCode | null> {
  try {
    const supabase = await createClient();
    return await getInviteCodeById(supabase, id);
  } catch (error) {
    logger.error("Failed to fetch invite code", error);
    throw new Error("Failed to fetch invite code");
  }
}

/**
 * Delete an invite code
 */
export async function deleteInviteCodeAction(id: number): Promise<void> {
  const supabase = await createClient();

  try {
    await deleteInviteCode(supabase, id);
  } catch (error) {
    logger.error("Failed to delete invite code", error);
    throw new Error("Failed to delete invite code");
  }
}

/**
 * Delete multiple invite codes
 */
export async function deleteInviteCodesAction(ids: number[]): Promise<void> {
  const supabase = await createClient();

  try {
    for (const id of ids) {
      await deleteInviteCode(supabase, id);
    }
  } catch (error) {
    logger.error("Failed to delete invite codes", error);
    throw new Error("Failed to delete invite codes");
  }
}

/**
 * Validate an invite code and set cookie if valid (can be called by non-authenticated users)
 */
export async function validateInviteCodeWithCookieAction(
  code: string
): Promise<ValidateInviteCodeResult> {
  try {
    const validated = validateInviteCodeSchema.parse({ code });
    const supabase = await createClient();

    const result = await validateInviteCode(supabase, validated.code);

    // If validation successful, set secure cookie
    if (result.isValid) {
      const cookieStore = await cookies();
      cookieStore.set("inviteValidated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 30, // 30 minutes
        path: "/",
      });

      logger.debug("Set invite validation cookie for successful validation");
    }

    return result;
  } catch (error) {
    logger.error("Failed to validate invite code", error);
    throw new Error("Failed to validate invite code");
  }
}

/**
 * Validate an invite code (can be called by non-authenticated users)
 */
export async function validateInviteCodeAction(
  code: string
): Promise<ValidateInviteCodeResult> {
  try {
    const validated = validateInviteCodeSchema.parse({ code });
    const supabase = await createClient();

    return await validateInviteCode(supabase, validated.code);
  } catch (error) {
    logger.error("Failed to validate invite code", error);
    throw new Error("Failed to validate invite code");
  }
}

/**
 * Get invite code details by code string (for checking without validation)
 */
export async function getInviteCodeByCodeAction(
  code: string
): Promise<InviteCode | null> {
  try {
    const validated = validateInviteCodeSchema.parse({ code });
    const supabase = await createClient();

    return await getInviteCodeByCode(supabase, validated.code);
  } catch (error) {
    logger.error("Failed to fetch invite code by code", error);
    throw new Error("Failed to fetch invite code");
  }
}
