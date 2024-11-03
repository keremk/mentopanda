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
