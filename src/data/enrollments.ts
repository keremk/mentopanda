import { SupabaseClient } from "@supabase/supabase-js";
import { getUserId, handleError } from "./utils";

export interface Enrollment {
  id: number;
  trainingTitle: String;
  trainingId: number;
  tagline: string;
  imageUrl: string;
  createdAt: string;
}

export async function enrollInTraining(
  supabase: SupabaseClient,
  trainingId: number
): Promise<void> {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("enrollments")
    .insert({ training_id: trainingId, user_id: userId });

  if (error) handleError(error);
}

export async function unenrollFromTraining(
  supabase: SupabaseClient,
  trainingId: number
): Promise<void> {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .match({ training_id: trainingId, user_id: userId });

  if (error) handleError(error);
}

export async function isEnrolled(
  supabase: SupabaseClient,
  trainingId: number
): Promise<boolean> {
  const userId = await getUserId(supabase);

  const { count, error } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .match({ training_id: trainingId, user_id: userId });

  if (error) handleError(error);

  return count === 1;
}
