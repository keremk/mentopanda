import { handleError } from "./utils"
import { SupabaseClient } from "@supabase/supabase-js"

export type Module = {
  id: number
  trainingId: number
  title: string
  instructions: string | null
  prompt: string | null
  videoUrl: string | null
  audioUrl: string | null
  createdAt: string
  updatedAt: string
}

export async function getModuleById(
  supabase: SupabaseClient,
  moduleId: string
): Promise<Module | null> {
  const { data: module, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    handleError(error)
  }

  if (!module) return null

  return {
    id: module.id,
    trainingId: module.training_id,
    title: module.title,
    instructions: module.instructions,
    prompt: module.prompt,
    videoUrl: module.video_url,
    audioUrl: module.audio_url,
    createdAt: module.created_at,
    updatedAt: module.updated_at
  }
}

// Add this new function to get modules for a training
export async function getModulesByTrainingId(
  supabase: SupabaseClient,
  trainingId: string
): Promise<Module[]> {
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("training_id", trainingId)
    .order("id");

  if (error) handleError(error);

  return (
    data?.map((module) => ({
      id: module.id,
      title: module.title,
      trainingId: module.training_id,
      instructions: module.instructions,
      prompt: module.prompt,
      videoUrl: module.video_url,
      audioUrl: module.audio_url,
      createdAt: module.created_at,
      updatedAt: module.updated_at,
    })) ?? []
  );
}

export type UpdateModuleInput = {
  id: number;
  trainingId: number;
  title: string;
  instructions: string | null;
  prompt: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
};

export async function updateModule(
  supabase: SupabaseClient,
  module: UpdateModuleInput
): Promise<Module> {
  const { data, error } = await supabase
    .from("modules")
    .update({
      title: module.title,
      instructions: module.instructions,
      prompt: module.prompt,
      video_url: module.videoUrl,
      audio_url: module.audioUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", module.id)
    .select();

  if (error) handleError(error);
  if (!data) throw new Error("Module not found");

  return {
    id: data.id,
    title: data.title,
    trainingId: data.training_id,
    instructions: data.instructions,
    prompt: data.prompt,
    videoUrl: data.video_url,
    audioUrl: data.audio_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createModule(
  supabase: SupabaseClient,
  trainingId: number,
  module: Omit<UpdateModuleInput, "id" | "trainingId">
): Promise<Module> {
  const { data, error } = await supabase
    .from("modules")
    .insert({
      training_id: trainingId,
      title: module.title,
      instructions: module.instructions,
      prompt: module.prompt,
      video_url: module.videoUrl,
      audio_url: module.audioUrl,
    })
    .select()
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create module");

  return {
    id: data.id,
    trainingId: data.training_id,
    title: data.title,
    instructions: data.instructions,
    prompt: data.prompt,
    videoUrl: data.video_url,
    audioUrl: data.audio_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteModule(
  supabase: SupabaseClient,
  moduleId: number,
  trainingId: number
): Promise<void> {
  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", moduleId)
    .eq("training_id", trainingId);

  if (error) handleError(error);
}