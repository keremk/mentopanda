"use server";

import { createClient } from "@/utils/supabase/server";
import {
  enrollInTraining,
  getEnrolledTrainings,
  isEnrolled,
  unenrollFromTraining,
} from "@/data/enrollments";

export async function isEnrolledAction(trainingId: number) {
  const supabase = createClient();
  return await isEnrolled(supabase, trainingId);
}

export async function enrollInTrainingAction(trainingId: number) {
  const supabase = createClient();
  return await enrollInTraining(supabase, trainingId);
}

export async function unenrollFromTrainingAction(trainingId: number) {
  const supabase = createClient();
  return await unenrollFromTraining(supabase, trainingId);
}

export async function getEnrolledTrainingsAction() {
  const supabase = createClient();
  return await getEnrolledTrainings(supabase);
}
