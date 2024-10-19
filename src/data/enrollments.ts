import SupabaseContext from "@/utils/supabase/context";
import { Training } from "./trainings";
import { QueryResult, QueryData, QueryError } from "@supabase/supabase-js";

export interface Enrollment {
  id: number;
  trainingTitle: String;
  trainingId: number;
  createdAt: string;
}

export async function getEnrolledTrainings(): Promise<Enrollment[]> {
  const supabase = SupabaseContext.getClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;

  const enrollmentsQuery = await supabase
    .from("enrollments")
    .select(
      `
    id,
    trainings (id, title),
    created_at
  `
    )
    .eq("user_id", userId);

  const { data, error } = await enrollmentsQuery;

  if (error) {
    throw new Error(`Failed to fetch enrollments: ${error.message}`);
  }

  // const transformedData = data.map((enrollment) => ({
  //   id: enrollment.id,
  //   trainingTitle: enrollment.trainings.title,
  //   trainingId: enrollment.trainings.id,
  //   createdAt: enrollment.created_at,
  // }));

  return data.map((enrollment: any) => ({
    id: enrollment.id,
    trainingTitle: enrollment.trainings.title,
    trainingId: enrollment.trainings.id,
    createdAt: enrollment.created_at,
  }));
}

export async function enrollInTraining(trainingId: number): Promise<void> {
  const supabase = SupabaseContext.getClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;

  const { error } = await supabase
    .from("enrollments")
    .insert({ training_id: trainingId, user_id: userId });

  if (error) {
    throw new Error(`Failed to enroll in training: ${error.message}`);
  }
}

export async function unenrollFromTraining(trainingId: number): Promise<void> {
  const supabase = SupabaseContext.getClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .match({ training_id: trainingId, user_id: userId });

  if (error) {
    throw new Error(`Failed to unenroll from training: ${error.message}`);
  }
}

export async function isEnrolled(trainingId: number): Promise<boolean> {
  const supabase = SupabaseContext.getClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("User is not authenticated");
  }

  const userId = session.user.id;

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
