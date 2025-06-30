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
  forUserId?: string,
  pageSize: number = 10,
  completedOnly: boolean = false
) {
  const supabase = await createClient();
  const start = (page - 1) * pageSize;

  const { data: entries, count } = await getTrainingHistory(
    supabase,
    pageSize,
    forUserId,
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

export async function getTrainingHeatmapDataAction(forUserId?: string) {
  const supabase = await createClient();
  return await getTrainingHeatmapData(supabase, forUserId);
}

export async function deleteHistoryEntryAction(id: number) {
  const supabase = await createClient();
  return await deleteHistoryEntry(supabase, id);
}

export async function getUserStatusForGreetingAction() {
  const supabase = await createClient();

  // Get the most recent completed training session
  const { data: latestHistory, error } = await supabase
    .from("history")
    .select(
      `
      id,
      module_id,
      feedback,
      completed_at,
      modules (
        id,
        title
      )
    `
    )
    .not("completed_at", "is", null) // Only completed sessions
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error getting user status:", error);
    // Return default status for new user
    return {
      hasHadSession: false,
      lastSessionDate: new Date(),
      lastSessionFeedback: "",
      lastSessionModuleId: "",
    };
  }

  // No sessions found - new user
  if (!latestHistory) {
    return {
      hasHadSession: false,
      lastSessionDate: new Date(),
      lastSessionFeedback: "",
      lastSessionModuleId: "",
    };
  }

  // User has had sessions
  return {
    hasHadSession: true,
    lastSessionDate: new Date(latestHistory.completed_at),
    lastSessionFeedback: latestHistory.feedback || "No feedback provided",
    lastSessionModuleId: latestHistory.module_id.toString(),
  };
}
