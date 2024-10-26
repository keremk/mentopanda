import { getOrganizationId, getUserId, handleError } from "@/data/utils";
import { SupabaseClient } from "@supabase/supabase-js";

type HistoryEntry = {
  id: number;
  moduleTitle: string;
  trainingTitle: string;
  assessmentText: string | null;
  assessmentScore: number | null;
  completedAt: Date | null;
  startedAt: Date;
};

export async function getTrainingHistory(
  supabase: SupabaseClient,
  limit: number
): Promise<HistoryEntry[]> {
  const userId = await getUserId(supabase);
  const { data: historyData, error: historyError } = await supabase
    .from("history")
    .select(`
      id,
      assessment_text,
      assessment_score,
      completed_at,
      started_at,
      modules (
        id,
        title,
        trainings (
          id,
          title
        )
      )
    `)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit)

  console.log(userId)
  console.log(historyData)
  if (historyError) handleError(historyError)

  if (!historyData) return []

  return historyData.map((entry: any) => ({
    id: entry.id,
    moduleTitle: entry.modules?.title,
    trainingTitle: entry.modules?.trainings?.title,
    assessmentText: entry.assessment_text,
    assessmentScore: entry.assessment_score,
    completedAt: entry.completed_at ? new Date(entry.completed_at) : null,
    startedAt: new Date(entry.started_at)
  }))
}
