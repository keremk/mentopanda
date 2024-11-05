"use server";

import { createClient } from "@/utils/supabase/server";
import { getTrainingById, getTrainings, getTrainingWithProgress, getTrainingsWithEnrollment } from "@/data/trainings";

export async function getTrainingsAction() {
  const supabase = createClient();
  return await getTrainings(supabase);
}

export async function getTrainingByIdAction(trainingId: string) {
  const supabase = createClient();
  return await getTrainingById(supabase, trainingId);
}

export async function getTrainingWithProgressAction(trainingId?: string) {
  const supabase = createClient();
  return await getTrainingWithProgress(supabase, trainingId);
}

export async function getTrainingsWithEnrollmentAction() {
  const supabase = createClient();
  return await getTrainingsWithEnrollment(supabase);
}
