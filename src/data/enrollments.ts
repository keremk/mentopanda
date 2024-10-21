import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

export interface Enrollment {
  id: number;
  trainingTitle: String;
  trainingId: number;
  createdAt: string;
}

interface RawEnrollment {
  id: number;
  trainings: {
    id: number;
    title: string;
  };
  created_at: string;
}

async function getUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("User is not authenticated");
  return user.id;
}

function handleError(error: PostgrestError) {
  // Postgres error codes: https://docs.postgrest.org/en/v12/references/errors.html

  if (error.code === "42501") {
    throw new Error("Access denied. Please check your permissions.");
  } else if (error.code === "PGRST301") {
    throw new Error("Row-level security policy violation.");
  } else {
    throw new Error(`Failed to fetch enrollments: ${error.message}`);
  }
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

  if (error) handleError(error);

  if (!data) return [];

  // console.log("Raw data:", JSON.stringify(data, null, 2));
  // data.forEach((enrollment, index) => {
  //   console.log(`Enrollment ${index}:`, JSON.stringify(enrollment, null, 2));
  //   console.log(`Trainings type: ${typeof enrollment.trainings}`);
  //   console.log(`Trainings is array: ${Array.isArray(enrollment.trainings)}`);
  // });

  /* 
    Why am I using "any" type?
    It's clear now that there's a mismatch between what TypeScript infers from the Supabase client and what's actually returned at runtime. 
Given that trainings is indeed an object and not an array at runtime, we'll need to update our type definitions and the way we handle the data.
  */

  return data.map((enrollment: any) => ({
    id: enrollment.id,
    trainingTitle: enrollment.trainings?.title ?? "",
    trainingId: enrollment.trainings?.id ?? 0,
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

  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .match({ training_id: trainingId, user_id: userId })
    .single();

  if (error && error.code !== "PGRST116")
    console.error(
      `Unexpected result for isEnrolled: ${error.code} ${error.message} `
    );
  if (error) handleError(error);

  return !!data;
}
