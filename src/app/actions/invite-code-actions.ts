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
import { z } from "zod";
import { logger } from "@/lib/logger";

const createInviteCodeSchema = z.object({
  code: z.string().min(1, "Code is required").optional(),
  expire_by: z.number().min(1, "Expiry days must be at least 1").optional(),
  created_for: z.string().email("Invalid email").nullable().optional(),
  codeLength: z.number().min(6).max(16).optional(),
});

const validateInviteCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
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
 * Get all invite codes for the current user
 */
export async function getInviteCodesAction(): Promise<InviteCode[]> {
  try {
    const supabase = await createClient();
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
  try {
    const supabase = await createClient();
    await deleteInviteCode(supabase, id);
  } catch (error) {
    logger.error("Failed to delete invite code", error);
    throw new Error("Failed to delete invite code");
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

/**
 * Check if an invite code is expired (utility function)
 */
export function isInviteCodeExpired(inviteCode: InviteCode): boolean {
  const createdAt = new Date(inviteCode.created_at);
  const expiryDate = new Date(
    createdAt.getTime() + inviteCode.expire_by * 24 * 60 * 60 * 1000
  );
  const now = new Date();

  return now > expiryDate;
}

/**
 * Get the expiry date of an invite code (utility function)
 */
export function getInviteCodeExpiryDate(inviteCode: InviteCode): Date {
  const createdAt = new Date(inviteCode.created_at);
  return new Date(
    createdAt.getTime() + inviteCode.expire_by * 24 * 60 * 60 * 1000
  );
}
