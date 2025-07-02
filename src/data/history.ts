import { handleError } from "@/data/utils";
import { TranscriptEntry } from "@/types/chat-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Database } from "@/types/supabase";
import { getUserId, getCurrentUserInfo } from "@/data/user";
export type HistorySummary = {
  id: number;
  moduleId: number;
  moduleTitle: string;
  trainingTitle: string;
  practiceNumber: number;
  assessmentCreated: boolean;
  startedAt: Date;
  completedAt: Date | null;
};

export type HistoryEntry = HistorySummary & {
  recordingUrl: string | null;
  transcriptText: string | null;
  transcript: TranscriptEntry[];
  assessmentText: string | null;
};

export type UpdateHistoryEntry = {
  id: number;
  recordingUrl?: string | null;
  transcript?: TranscriptEntry[] | null;
  transcriptText?: string | null;
  assessmentText?: string | null;
  assessmentCreated?: boolean;
  completedAt?: Date | null;
};

export async function getTrainingHistory(
  supabase: SupabaseClient<Database>,
  limit: number,
  forUserId?: string,
  completedOnly: boolean = false,
  start: number = 0
): Promise<{ data: HistorySummary[]; count: number }> {
  const currentUser = await getCurrentUserInfo(supabase);
  const userId = forUserId ?? currentUser.id;

  let query = supabase
    .from("history")
    .select(
      `
      id,
      practice_no,
      completed_at,
      started_at,
      module_id,
      assessment_created,
      modules!inner (
        id,
        title,
        trainings!inner (
          id,
          title,
          project_id
        )
      )
    `,
      { count: "estimated" }
    )
    .eq("user_id", userId)
    // Filter by modules that belong to trainings in the current project
    .eq("modules.trainings.project_id", currentUser.currentProject.id)
    .order("started_at", { ascending: false })
    .range(start, start + limit - 1);

  if (completedOnly) {
    query = query.not("completed_at", "is", null);
  }

  const { data: historyData, error: historyError, count } = await query;

  if (historyError) handleError(historyError);
  if (!historyData || historyData.length === 0) return { data: [], count: 0 };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const data = historyData.map((entry: any) => ({
    id: entry.id,
    moduleId: entry.module_id,
    moduleTitle: entry.modules?.title,
    trainingTitle: entry.modules?.trainings?.title,
    assessmentCreated: entry.assessment_created,
    completedAt: entry.completed_at ? new Date(entry.completed_at) : null,
    startedAt: new Date(entry.started_at),
    practiceNumber: entry.practice_no,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { data, count: count ?? 0 };
}

export async function createHistoryEntry(
  supabase: SupabaseClient,
  moduleId: number
): Promise<number> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("history")
    .insert({
      user_id: userId,
      module_id: moduleId,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create history entry");

  return data.id;
}

export async function updateHistoryEntry(
  supabase: SupabaseClient,
  { id, ...updates }: UpdateHistoryEntry
): Promise<void> {
  const userId = await getUserId(supabase);

  // Build update object with only defined fields
  const updateData: Record<string, unknown> = {};
  if (updates.recordingUrl !== undefined)
    updateData.recording_url = updates.recordingUrl;
  if (updates.transcriptText !== undefined)
    updateData.transcript_text = updates.transcriptText;
  if (updates.transcript !== undefined)
    updateData.transcript_json = updates.transcript;
  if (updates.assessmentText !== undefined)
    updateData.assessment_text = updates.assessmentText;
  if (updates.assessmentCreated !== undefined)
    updateData.assessment_created = updates.assessmentCreated;
  if (updates.completedAt !== undefined) {
    if (!(updates.completedAt instanceof Date)) {
      throw new Error("completedAt must be a valid Date object");
    }
    updateData.completed_at = updates.completedAt.toISOString();
  }

  const { error } = await supabase
    .from("history")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId); // Security: ensure user owns this entry

  if (error) handleError(error);
}

export async function getHistoryEntry(
  supabase: SupabaseClient,
  id: number
): Promise<HistoryEntry | null> {
  const { data, error } = await supabase
    .from("history")
    .select(
      `
      id,
      assessment_text,
      recording_url,
      transcript_text,
      transcript_json,
      assessment_created,
      completed_at,
      started_at,
      practice_no,
      module_id,
      modules (
        id,
        title,
        trainings (
          id,
          title
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (!data) return null;
  if (error) handleError(error);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    id: data.id,
    moduleId: data.module_id,
    moduleTitle: (data.modules as any)?.title ?? null, // Disconnect from Supabase expected schema vs. what we get back, so I am doing this here
    trainingTitle: (data.modules as any)?.trainings?.title ?? null,
    recordingUrl: data.recording_url,
    transcriptText: data.transcript_text,
    transcript: data.transcript_json,
    assessmentText: data.assessment_text,
    assessmentCreated: data.assessment_created,
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
    startedAt: new Date(data.started_at),
    practiceNumber: data.practice_no,
  };
}

export async function getTrainingHeatmapData(
  supabase: SupabaseClient<Database>,
  forUserId?: string
): Promise<Record<string, number>> {
  const currentUser = await getCurrentUserInfo(supabase);
  const userId = forUserId ?? currentUser.id;
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data, error } = await supabase
    .from("history")
    .select(
      `
      started_at,
      modules!inner (
        trainings!inner (
          project_id
        )
      )
    `
    )
    .eq("user_id", userId)
    // Filter by modules that belong to trainings in the current project
    .eq("modules.trainings.project_id", currentUser.currentProject.id)
    .gte("started_at", threeMonthsAgo.toISOString())
    .order("started_at", { ascending: true });

  if (error) handleError(error);
  if (!data) return {};

  // Group sessions by date
  return data.reduce((acc: Record<string, number>, entry) => {
    if (!entry.started_at) return acc;

    const date = new Date(entry.started_at);
    const dateKey = format(date, "yyyy-MM-dd");
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});
}

export async function deleteHistoryEntry(supabase: SupabaseClient, id: number) {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("history")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) handleError(error);
}

export type UserTrainingStatus = {
  hasHadSession: boolean;
  lastSessionDate: Date;
  lastSessionAssessment: string;
  lastSessionModuleId: string;
};

export async function getUserTrainingStatus(
  supabase: SupabaseClient
): Promise<UserTrainingStatus> {
  const userId = await getUserId(supabase);

  // Get the most recent completed training session
  const { data: latestHistory, error } = await supabase
    .from("history")
    .select(
      `
      id,
      module_id,
      assessment_text,
      completed_at,
      modules (
        id,
        title
      )
    `
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null) // Only completed sessions
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    handleError(error);
  }

  // No sessions found - new user
  if (!latestHistory) {
    return {
      hasHadSession: false,
      lastSessionDate: new Date(),
      lastSessionAssessment: "",
      lastSessionModuleId: "",
    };
  }

  // User has had sessions
  return {
    hasHadSession: true,
    lastSessionDate: new Date(latestHistory.completed_at),
    lastSessionAssessment:
      latestHistory.assessment_text || "No assessment provided",
    lastSessionModuleId: latestHistory.module_id.toString(),
  };
}
