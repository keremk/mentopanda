"use server";

import { createClient } from "@/utils/supabase/server";
import { 
  getTrainingById, 
  getTrainings, 
  getTrainingWithProgress, 
  getTrainingsWithEnrollment,
  updateTraining,
  updateModule,
  createModule,
  deleteModule,
  type UpdateTrainingInput,
  type UpdateModuleInput
} from "@/data/trainings";

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

export async function updateTrainingAction(training: UpdateTrainingInput) {
  const supabase = createClient();
  return await updateTraining(supabase, training);
}

export async function updateModuleAction(module: UpdateModuleInput) {
  const supabase = createClient();
  return await updateModule(supabase, module);
}

export async function createModuleAction(
  trainingId: number,
  module: Omit<UpdateModuleInput, 'id' | 'trainingId'>
) {
  const supabase = createClient();
  return await createModule(supabase, trainingId, module);
}

export async function deleteModuleAction(moduleId: number, trainingId: number) {
  const supabase = createClient();
  return await deleteModule(supabase, moduleId, trainingId);
}
