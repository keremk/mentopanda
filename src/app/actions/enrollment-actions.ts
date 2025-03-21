"use server";

import { createClient } from "@/utils/supabase/server";
import {
  enrollInTraining,
  isEnrolled,
  unenrollFromTraining,
} from "@/data/enrollments";
import { getEnrolledTrainings } from "@/data/enrollments";
import { cache } from "react";

export async function getEnrolledTrainingsAction() {
  const supabase = await createClient();
  return await getEnrolledTrainings(supabase);
}

export const getEnrolledTrainingsActionCached = cache(async () => {
  const supabase = await createClient();
  return await getEnrolledTrainings(supabase);
});

export async function isEnrolledAction(trainingId: number) {
  const supabase = await createClient();
  return await isEnrolled(supabase, trainingId);
}

export async function enrollInTrainingAction(trainingId: number) {
  const supabase = await createClient();
  return await enrollInTraining(supabase, trainingId);
}

export async function unenrollFromTrainingAction(trainingId: number) {
  const supabase = await createClient();
  return await unenrollFromTraining(supabase, trainingId);
}
