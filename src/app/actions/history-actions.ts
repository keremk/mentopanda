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
  page: number = 1,
  pageSize: number = 10,
  completedOnly: boolean = false
) {
  const supabase = await createClient();
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  // Get total count for pagination
  const { count } = await supabase
    .from("history")
    .select("*", { count: "exact", head: true });

  const entries = await getTrainingHistory(
    supabase,
    pageSize,
    completedOnly,
    start
  );

  return {
    entries,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: page,
  };
}

export async function createHistoryEntryAction(moduleId: number) {
  const supabase = await createClient();
  return await createHistoryEntry(supabase, moduleId);
}

export async function updateHistoryEntryAction(updates: UpdateHistoryEntry) {
  const supabase = await createClient();
  await updateHistoryEntry(supabase, updates);
  return { success: true };
}

export async function getHistoryEntryAction(id: number) {
  const supabase = await createClient();
  return await getHistoryEntry(supabase, id);
}

export async function getTrainingHeatmapDataAction() {
  const supabase = await createClient();
  return await getTrainingHeatmapData(supabase);
}

export async function deleteHistoryEntryAction(id: number) {
  const supabase = await createClient();
  return await deleteHistoryEntry(supabase, id);
}
