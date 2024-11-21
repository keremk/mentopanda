import { getOrganizationId, getUserId, handleError } from "@/data/utils";
import { SupabaseClient } from "@supabase/supabase-js";

export type HistoryEntry = {
  id: number;
  moduleId: number;
  moduleTitle: string;
  trainingTitle: string;
  recordingUrl: string | null;
  transcript: string | null;
  assessmentText: string | null;
  assessmentScore: number | null;
  completedAt: Date | null;
  startedAt: Date;
  attemptNumber: number;
};

export type UpdateHistoryEntry = {
  id: number;
  recordingUrl?: string | null;
  transcript?: string | null;
  assessmentText?: string | null;
  assessmentScore?: number | null;
  completedAt?: Date | null;
};

export async function getTrainingHistory(
  supabase: SupabaseClient,
  limit: number,
  completedOnly: boolean = false
): Promise<HistoryEntry[]> {
  const userId = await getUserId(supabase);
  let query = supabase
    .from("history")
    .select(
      `
      id,
      assessment_text,
      recording_url,
      transcript,
      assessment_score,
      completed_at,
      started_at,
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
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (completedOnly) {
    query = query.not("completed_at", "is", null);
  }

  const { data: historyData, error: historyError } = await query;

  // console.log(userId);
  // console.log(historyData);
  if (historyError) handleError(historyError);

  if (!historyData) return [];

  // Get all attempts for each module to calculate attempt numbers
  const moduleAttempts = new Map<number, number>();
  historyData.forEach((entry: any) => {
    const moduleId = entry.module_id;
    moduleAttempts.set(moduleId, (moduleAttempts.get(moduleId) || 0) + 1);
  });

  return historyData.map((entry: any) => ({
    id: entry.id,
    moduleId: entry.module_id,
    moduleTitle: entry.modules?.title,
    trainingTitle: entry.modules?.trainings?.title,
    recordingUrl: entry.recording_url,
    transcript: entry.transcript,
    assessmentText: entry.assessment_text,
    assessmentScore: entry.assessment_score,
    completedAt: entry.completed_at ? new Date(entry.completed_at) : null,
    startedAt: new Date(entry.started_at),
    attemptNumber: moduleAttempts.get(entry.module_id) || 1,
  }));
}

export async function createHistoryEntry(
  supabase: SupabaseClient,
  moduleId: number
): Promise<number> {
  const userId = await getUserId(supabase);
  const organizationId = await getOrganizationId(supabase);

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

  const { error } = await supabase
    .from("history")
    .update({
      recording_url: updates.recordingUrl,
      transcript: updates.transcript,
      assessment_text: updates.assessmentText,
      assessment_score: updates.assessmentScore,
      completed_at: updates.completedAt?.toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId); // Security: ensure user owns this entry

  if (error) handleError(error);
}

export async function getHistoryEntry(
  supabase: SupabaseClient,
  id: number
): Promise<HistoryEntry | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("history")
    .select(
      `
      id,
      assessment_text,
      recording_url,
      transcript,
      assessment_score,
      completed_at,
      started_at,
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
    .eq("user_id", userId) // Security: ensure user owns this entry
    .single();

  if (!data) return null;
  if (error) handleError(error);

  return {
    id: data.id,
    moduleId: data.module_id,
    moduleTitle: (data.modules as any)?.title ?? null, // Disconnect from Supabase expected schema vs. what we get back, so I am doing this here
    trainingTitle: (data.modules as any)?.trainings?.title ?? null,
    recordingUrl: data.recording_url,
    transcript: data.transcript,
    assessmentText: data.assessment_text,
    assessmentScore: data.assessment_score,
    completedAt: data.completed_at ? new Date(data.completed_at) : null,
    startedAt: new Date(data.started_at),
    attemptNumber: 1, // Note: We don't calculate attempt number for single entries
  };
}
