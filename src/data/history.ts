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

  const { error } = await supabase
    .from("history")
    .update({
      recording_url: updates.recordingUrl,
      transcript_text: updates.transcriptText,
      transcript_json: updates.transcript,
      assessment_text: updates.assessmentText,
      assessment_created: updates.assessmentCreated,
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
  await supabase.from("history").delete().eq("id", id).eq("user_id", userId);
}
