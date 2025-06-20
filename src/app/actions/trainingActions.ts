"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import {
  getTrainingById,
  getTrainingWithProgress,
  getTrainingsWithEnrollment,
  updateTraining,
  createTraining,
  type UpdateTrainingInput,
  deleteTraining,
  getTrainingByIdForEdit,
} from "@/data/trainings";
import { redirect } from "next/navigation";

export async function getTrainingByIdAction(trainingId: number) {
  const supabase = await createClient();
  return await getTrainingById(supabase, trainingId);
}

export async function getTrainingByIdForEditAction(trainingId: number) {
  const supabase = await createClient();
  return await getTrainingByIdForEdit(supabase, trainingId);
}

export async function getTrainingWithProgressAction(trainingId: number) {
  const supabase = await createClient();
  return await getTrainingWithProgress(supabase, trainingId);
}

export async function getTrainingsWithEnrollmentAction() {
  const supabase = await createClient();
  return await getTrainingsWithEnrollment(supabase);
}

export async function updateTrainingAction(training: UpdateTrainingInput) {
  const supabase = await createClient();
  const result = await updateTraining(supabase, training);

  // Revalidate training cache
  revalidateTag(`training-${training.id}`);

  return result;
}

export async function createTrainingAction() {
  const supabase = await createClient();
  const training = await createTraining(supabase, {
    title: "New Training",
  });

  redirect(`/explore/${training.id}/edit`);
}

export async function deleteTrainingAction(trainingId: number) {
  const supabase = await createClient();
  await deleteTraining(supabase, trainingId);
}
