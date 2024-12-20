"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTrainingHistory,
  createHistoryEntry,
  updateHistoryEntry,
  getHistoryEntry,
  type UpdateHistoryEntry,
  getTrainingHeatmapData,
  deleteHistoryEntry,
} from "@/data/history";

export async function getTrainingHistoryAction(
  limit: number,
  completedOnly: boolean = false
) {
  const supabase = createClient();
  return await getTrainingHistory(supabase, limit, completedOnly);
}

export async function createHistoryEntryAction(moduleId: number) {
  const supabase = createClient();
  return await createHistoryEntry(supabase, moduleId);
}

export async function updateHistoryEntryAction(updates: UpdateHistoryEntry) {
  const supabase = createClient();
  await updateHistoryEntry(supabase, updates);
  return { success: true };
}

export async function getHistoryEntryAction(id: number) {
  const supabase = createClient();
  return await getHistoryEntry(supabase, id);
}

export async function getTrainingHeatmapDataAction() {
  const supabase = createClient();
  return await getTrainingHeatmapData(supabase);
}

export async function deleteHistoryEntryAction(id: number) {
  const supabase = createClient();
  return await deleteHistoryEntry(supabase, id);
}
