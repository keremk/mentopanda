"use server";

import {
  getModuleById,
  getModulesByTrainingId,
  updateModule,
  createModule,
  deleteModule,
  UpdateModuleInput,
  getModuleById2,
  type Module2,
} from "@/data/modules";
import { createClient } from "@/utils/supabase/server";

export async function getModulesByTrainingIdAction(trainingId: string) {
  const supabase = createClient();
  return await getModulesByTrainingId(supabase, trainingId);
}

export async function getModuleByIdAction(moduleId: number) {
  const supabase = createClient();
  return await getModuleById(supabase, moduleId);
}

export async function updateModuleAction(module: UpdateModuleInput) {
  const supabase = createClient();
  return await updateModule(supabase, module);
}

export async function createModuleAction(
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
) {
  const supabase = createClient();
  return await createModule(supabase, trainingId, module);
}

export async function deleteModuleAction(moduleId: number, trainingId: number) {
  const supabase = createClient();
  return await deleteModule(supabase, moduleId, trainingId);
}

export async function getModuleByIdAction2(
  moduleId: number
): Promise<Module2 | null> {
  const supabase = createClient();
  return await getModuleById2(supabase, moduleId);
}
