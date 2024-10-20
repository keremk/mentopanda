import { SupabaseClient } from "@supabase/supabase-js";

export interface Enrollment {
  id: number;
  trainingTitle: String;
  trainingId: number;
  createdAt: string;
}

async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User is not authenticated");
  return user.id;
}

export async function getEnrolledTrainings(
  supabase: SupabaseClient
): Promise<Enrollment[]> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      id,
      trainings (id, title),
      created_at
    `
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch enrollments: ${error.message}`);
  }

  return data.map((enrollment: any) => ({
    id: enrollment.id,
    trainingTitle: enrollment.trainings.title,
    trainingId: enrollment.trainings.id,
    createdAt: enrollment.created_at,
  }));
}

export async function enrollInTraining(
  supabase: SupabaseClient,
  trainingId: number
): Promise<void> {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("enrollments")
    .insert({ training_id: trainingId, user_id: userId });

  if (error) {
    throw new Error(`Failed to enroll in training: ${error.message}`);
  }
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

  if (error) {
    throw new Error(`Failed to unenroll from training: ${error.message}`);
  }
}

export async function isEnrolled(
  supabase: SupabaseClient,
  trainingId: number
): Promise<boolean> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .match({ training_id: trainingId, user_id: userId })
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check enrollment status: ${error.message}`);
  }

  return !!data;
}
