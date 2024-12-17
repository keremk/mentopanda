"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTrainingById,
  getTrainingWithProgress,
  getTrainingsWithEnrollment,
  getEnrolledTrainings,
  updateTraining,
  createTraining,
  type UpdateTrainingInput,
} from "@/data/trainings";
import { redirect } from "next/navigation";

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

export async function createTrainingAction(formData: FormData) {
  const supabase = createClient();
  const training = await createTraining(supabase, {
    title: "New Training",
    tagline: "Training description goes here",
    description: "",
    imageUrl: "/course-images/meetings.jpg", // default image
    previewUrl: null,
    isPublic: false,
  });

  redirect(`/explore/${training.id}/edit`);
}
