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
  attemptNumber: number;
};

export async function getTrainingHistory(
  supabase: SupabaseClient,
  limit: number,
  completedOnly: boolean = false
): Promise<HistoryEntry[]> {
  const userId = await getUserId(supabase);
  let query = supabase
    .from("history")
    .select(`
      id,
      assessment_text,
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
    `)
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
    moduleTitle: entry.modules?.title,
    trainingTitle: entry.modules?.trainings?.title,
    assessmentText: entry.assessment_text,
    assessmentScore: entry.assessment_score,
    completedAt: entry.completed_at ? new Date(entry.completed_at) : null,
    startedAt: new Date(entry.started_at),
    attemptNumber: moduleAttempts.get(entry.module_id) || 1
  }));
}
