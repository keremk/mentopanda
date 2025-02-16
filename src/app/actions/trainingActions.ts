"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTrainingById,
  getTrainingWithProgress,
  getTrainingsWithEnrollment,
  updateTraining,
  createTraining,
  type UpdateTrainingInput,
  deleteTraining,
} from "@/data/trainings";
import { redirect } from "next/navigation";

export async function getTrainingByIdAction(trainingId: number) {
  const supabase = await createClient();
  return await getTrainingById(supabase, trainingId);
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
  return await updateTraining(supabase, training);
}

export async function createTrainingAction() {
  const supabase = await createClient();
  const training = await createTraining(supabase, {
    title: "New Training",
    tagline: "Training description goes here",
    description: "",
    imageUrl: "/course-images/meetings.jpg", // default image
    previewUrl: null,
  });

  redirect(`/explore/${training.id}/edit`);
}

export async function deleteTrainingAction(trainingId: number) {
  const supabase = await createClient();
  await deleteTraining(supabase, trainingId);
  redirect("/explore");
}
