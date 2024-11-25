"use server";

import { createClient } from "@/utils/supabase/server";
import { 
  getTrainingById, 
  getTrainingWithProgress, 
  getTrainingsWithEnrollment,
  getEnrolledTrainings,
  updateTraining,
  type UpdateTrainingInput,
} from "@/data/trainings";

export async function getTrainingByIdAction(trainingId: number) {
  const supabase = createClient();
  return await getTrainingById(supabase, trainingId);
}

export async function getEnrolledTrainingsAction() {
  const supabase = createClient();
  return await getEnrolledTrainings(supabase);
}

export async function getTrainingWithProgressAction(trainingId: number) {
  const supabase = createClient();
  return await getTrainingWithProgress(supabase, trainingId);
}

export async function getTrainingsWithEnrollmentAction() {
  const supabase = createClient();
  return await getTrainingsWithEnrollment(supabase);
}

export async function updateTrainingAction(training: UpdateTrainingInput) {
  const supabase = createClient();
  return await updateTraining(supabase, training);
}

