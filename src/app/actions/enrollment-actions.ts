"use server";

import { createClient } from "@/utils/supabase/server";
import {
  enrollInTraining,
  isEnrolled,
  unenrollFromTraining,
} from "@/data/enrollments";
import { getEnrolledTrainings } from "@/data/enrollments";
import { cache } from "react";
import { User } from "@/data/user";

export async function getEnrolledTrainingsAction(user: User) {
  const supabase = await createClient();
  return await getEnrolledTrainings(supabase, user);
}

export const getEnrolledTrainingsActionCached = cache(async (user: User) => {
  const supabase = await createClient();
  return await getEnrolledTrainings(supabase, user);
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
