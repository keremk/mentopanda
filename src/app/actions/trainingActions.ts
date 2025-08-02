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
  toggleTrainingPublicStatus,
  getPublicTrainings,
  copyPublicTrainingToProject,
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

export async function toggleTrainingPublicStatusAction(
  trainingId: number,
  isPublic: boolean
) {
  const supabase = await createClient();
  const result = await toggleTrainingPublicStatus(supabase, trainingId, isPublic);

  // Revalidate training cache
  revalidateTag(`training-${trainingId}`);
  
  // If making public, also revalidate public trainings cache
  if (isPublic) {
    revalidateTag("public-trainings");
  }

  return result;
}

export async function getPublicTrainingsAction(
  limit: number = 20,
  offset: number = 0
) {
  const supabase = await createClient();
  return await getPublicTrainings(supabase, limit, offset);
}

export async function copyPublicTrainingToProjectAction(
  sourceTrainingId: number
) {
  const supabase = await createClient();
  
  // Perform the database deep copy with storage copying
  const { trainingId, characterMapping, moduleMapping } = 
    await copyPublicTrainingToProject(supabase, sourceTrainingId);

  // Revalidate training cache
  revalidateTag(`training-${trainingId}`);

  return { 
    trainingId, 
    characterMapping, 
    moduleMapping,
    success: true 
  };
}
