"use server";

import {
  updateModule,
  createModule,
  deleteModule,
  UpdateModuleInput,
  getModuleById2,
  Module,
} from "@/data/modules";
import { createClient } from "@/utils/supabase/server";

export async function updateModuleAction(module: UpdateModuleInput) {
  const supabase = await createClient();
  return await updateModule(supabase, module);
}

export async function createModuleAction(
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
) {
  const supabase = await createClient();
  return await createModule(supabase, trainingId, module);
}

export async function deleteModuleAction(moduleId: number, trainingId: number) {
  const supabase = await createClient();
  return await deleteModule(supabase, moduleId, trainingId);
}

export async function getModuleByIdAction2(
  moduleId: number
): Promise<Module | null> {
  const supabase = await createClient();
  return await getModuleById2(supabase, moduleId);
}
