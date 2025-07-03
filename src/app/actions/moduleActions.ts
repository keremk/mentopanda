"use server";

import { revalidateTag } from "next/cache";
import {
  updateModule,
  createModule,
  deleteModule,
  UpdateModuleInput,
  getModuleById2,
  Module,
  getModulesForCurrentProject,
} from "@/data/modules";
import { createClient } from "@/utils/supabase/server";
import { getRandomModuleRecommendation } from "@/data/modules";

export async function updateModuleAction(module: UpdateModuleInput) {
  const supabase = await createClient();
  const result = await updateModule(supabase, module);

  // Revalidate training cache since module changes affect training data
  revalidateTag(`training-${module.trainingId}`);

  return result;
}

export async function createModuleAction(
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
) {
  const supabase = await createClient();
  const result = await createModule(supabase, trainingId, module);

  // Revalidate training cache since new module affects training data
  revalidateTag(`training-${trainingId}`);

  return result;
}

export async function deleteModuleAction(moduleId: number, trainingId: number) {
  const supabase = await createClient();
  const result = await deleteModule(supabase, moduleId, trainingId);

  // Revalidate training cache since module deletion affects training data
  revalidateTag(`training-${trainingId}`);

  return result;
}

export async function getModuleByIdAction2(
  moduleId: number
): Promise<Module | null> {
  const supabase = await createClient();
  return await getModuleById2(supabase, moduleId);
}

export async function getModulesForCurrentProjectAction() {
  const supabase = await createClient();
  return await getModulesForCurrentProject(supabase);
}

export async function getRandomModuleRecommendationAction() {
  const supabase = await createClient();
  return await getRandomModuleRecommendation(supabase);
}
