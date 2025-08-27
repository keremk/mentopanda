"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getOrCreateOverallProgress,
  getOverallProgress,
  updateOverallProgress,
  deleteOverallProgress,
  getOrCreateModuleProgress,
  getModuleProgress,
  getAllModuleProgress,
  updateModuleProgress,
  deleteModuleProgress,
  type OverallProgress,
  type ModuleProgress,
} from "@/data/progress";

// Overall Progress Actions
export async function getOrCreateOverallProgressAction(
  profileId: string
): Promise<OverallProgress> {
  const supabase = await createClient();
  return await getOrCreateOverallProgress(supabase, profileId);
}

export async function getOverallProgressAction(
  profileId: string
): Promise<OverallProgress | null> {
  const supabase = await createClient();
  return await getOverallProgress(supabase, profileId);
}

export async function updateOverallProgressAction(
  profileId: string,
  assessmentText?: string | null
) {
  const supabase = await createClient();
  await updateOverallProgress(supabase, profileId, assessmentText);
  return { success: true };
}

export async function deleteOverallProgressAction(
  profileId: string
) {
  const supabase = await createClient();
  await deleteOverallProgress(supabase, profileId);
  return { success: true };
}

// Module Progress Actions
export async function getOrCreateModuleProgressAction(
  profileId: string,
  moduleId: number
): Promise<ModuleProgress> {
  const supabase = await createClient();
  return await getOrCreateModuleProgress(supabase, profileId, moduleId);
}

export async function getModuleProgressAction(
  profileId: string,
  moduleId: number
): Promise<ModuleProgress | null> {
  const supabase = await createClient();
  return await getModuleProgress(supabase, profileId, moduleId);
}

export async function getAllModuleProgressAction(
  profileId: string
): Promise<ModuleProgress[]> {
  const supabase = await createClient();
  return await getAllModuleProgress(supabase, profileId);
}

export async function updateModuleProgressAction(
  profileId: string,
  moduleId: number,
  assessmentText?: string | null
) {
  const supabase = await createClient();
  await updateModuleProgress(supabase, profileId, moduleId, assessmentText);
  return { success: true };
}

export async function deleteModuleProgressAction(
  profileId: string,
  moduleId: number
) {
  const supabase = await createClient();
  await deleteModuleProgress(supabase, profileId, moduleId);
  return { success: true };
}