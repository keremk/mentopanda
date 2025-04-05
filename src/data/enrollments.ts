import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { TrainingSummary } from "./trainings";
import { getUserId } from "./user";
import { User } from "./user";
export interface Enrollment {
  id: number;
  trainingTitle: string;
  trainingId: number;
  tagline: string;
  imageUrl: string;
  createdAt: string;
}

export async function getEnrolledTrainings(
  supabase: SupabaseClient,
  user: User
): Promise<TrainingSummary[]> {
  // const user = await getCurrentUserInfo(supabase);

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      training_id,
      trainings!inner (id, title, tagline, image_url, project_id),
      created_at
    `
    )
    .eq("user_id", user.id)
    .eq("trainings.project_id", user.currentProject.id)
    .order("created_at", { ascending: false });

  if (error) handleError(error);

  if (!data) return [];

  /* 
    Why am I using "any" type?
    It's clear now that there's a mismatch between what TypeScript infers from the Supabase client and what's actually returned at runtime. 
Given that trainings is indeed an object and not an array at runtime, we'll need to update our type definitions and the way we handle the data.
  */

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return data.map((enrollment: any) => ({
    id: enrollment.trainings?.id,
    title: enrollment.trainings?.title ?? "",
    tagline: enrollment.trainings?.tagline ?? "",
    imageUrl: enrollment.trainings?.image_url ?? "",
    createdAt: new Date(enrollment.trainings?.created_at),
    updatedAt: new Date(enrollment.trainings?.updated_at),
    projectId: enrollment.trainings?.project_id,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
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
