"use server";

import {
  addToWaitingList,
  getWaitingListEntries,
  getWaitingListEntryById,
  deleteWaitingListEntry,
  checkEmailInWaitingList,
  type WaitingListEntry,
} from "@/data/waiting-list";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createWaitingListSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  comment: z.string().optional(),
});

/**
 * Add someone to the waiting list (no authentication required)
 */
export async function addToWaitingListAction(
  email: string,
  comment?: string
): Promise<WaitingListEntry> {
  try {
    const validated = createWaitingListSchema.parse({
      email,
      comment,
    });

    const supabase = await createClient();

    return await addToWaitingList(supabase, {
      email: validated.email,
      comment: validated.comment !== undefined ? validated.comment : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    logger.error("Failed to add to waiting list", error);
    throw new Error("Failed to add to waiting list");
  }
}

/**
 * Get all waiting list entries (no authentication required)
 */
export async function getWaitingListEntriesAction(): Promise<
  WaitingListEntry[]
> {
  const supabase = await createClient();

  try {
    return await getWaitingListEntries(supabase);
  } catch (error) {
    logger.error("Failed to fetch waiting list entries", error);
    throw new Error("Failed to fetch waiting list entries");
  }
}

/**
 * Get a specific waiting list entry by ID (no authentication required)
 */
export async function getWaitingListEntryAction(
  id: number
): Promise<WaitingListEntry | null> {
  try {
    const supabase = await createClient();
    return await getWaitingListEntryById(supabase, id);
  } catch (error) {
    logger.error("Failed to fetch waiting list entry", error);
    throw new Error("Failed to fetch waiting list entry");
  }
}

/**
 * Delete a waiting list entry (requires authentication)
 */
export async function deleteWaitingListEntryAction(id: number): Promise<void> {
  const supabase = await createClient();

  try {
    await deleteWaitingListEntry(supabase, id);
  } catch (error) {
    logger.error("Failed to delete waiting list entry", error);
    throw new Error("Failed to delete waiting list entry");
  }
}

/**
 * Delete multiple waiting list entries (requires authentication)
 */
export async function deleteWaitingListEntriesAction(
  ids: number[]
): Promise<void> {
  const supabase = await createClient();

  try {
    for (const id of ids) {
      await deleteWaitingListEntry(supabase, id);
    }
  } catch (error) {
    logger.error("Failed to delete waiting list entries", error);
    throw new Error("Failed to delete waiting list entries");
  }
}

/**
 * Check if an email is already in the waiting list (no authentication required)
 */
export async function checkEmailInWaitingListAction(
  email: string
): Promise<boolean> {
  try {
    const validated = z.string().email().parse(email);
    const supabase = await createClient();
    return await checkEmailInWaitingList(supabase, validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Please enter a valid email address");
    }
    logger.error("Failed to check email in waiting list", error);
    throw new Error("Failed to check email in waiting list");
  }
}
