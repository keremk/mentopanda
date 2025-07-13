import { SupabaseClient } from "@supabase/supabase-js";
import { handleError } from "./utils";
import { getUserId } from "./user";

export type TrainingNote = {
  moduleId: number;
  userId: string;
  notes: string | null;
  draft: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTrainingNoteInput = {
  moduleId: number;
  notes: string | null;
};

export type UpdateTrainingNoteInput = {
  moduleId: number;
  notes: string | null;
};

export async function getTrainingNote(
  supabase: SupabaseClient,
  moduleId: number
): Promise<TrainingNote | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("training_notes")
    .select("*")
    .eq("module_id", moduleId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No row found - this is expected for non-existent notes
      return null;
    }
    handleError(error);
  }

  if (!data) return null;

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function createTrainingNote(
  supabase: SupabaseClient,
  input: CreateTrainingNoteInput
): Promise<TrainingNote> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("training_notes")
    .insert({
      module_id: input.moduleId,
      user_id: userId,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to create training note");

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function updateTrainingNote(
  supabase: SupabaseClient,
  input: UpdateTrainingNoteInput
): Promise<TrainingNote> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("training_notes")
    .update({
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("module_id", input.moduleId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to update training note");

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function deleteTrainingNote(
  supabase: SupabaseClient,
  moduleId: number
): Promise<void> {
  const userId = await getUserId(supabase);

  const { error } = await supabase
    .from("training_notes")
    .delete()
    .eq("module_id", moduleId)
    .eq("user_id", userId);

  if (error) handleError(error);
}

export async function upsertTrainingNote(
  supabase: SupabaseClient,
  input: UpdateTrainingNoteInput
): Promise<TrainingNote> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("training_notes")
    .upsert(
      {
        module_id: input.moduleId,
        user_id: userId,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "module_id,user_id",
      }
    )
    .select("*")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to upsert training note");

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function appendToDraft(
  supabase: SupabaseClient,
  moduleId: number,
  draftContent: string
): Promise<TrainingNote> {
  const userId = await getUserId(supabase);

  // First, get the current draft content
  const { data: currentData, error: selectError } = await supabase
    .from("training_notes")
    .select("draft")
    .eq("module_id", moduleId)
    .eq("user_id", userId)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    handleError(selectError);
  }

  // Append to existing draft or create new
  const currentDraft = currentData?.draft || "";
  const newDraft = currentDraft + draftContent;

  const { data, error } = await supabase
    .from("training_notes")
    .upsert(
      {
        module_id: moduleId,
        user_id: userId,
        draft: newDraft,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "module_id,user_id",
      }
    )
    .select("*")
    .single();

  if (error) handleError(error);
  if (!data) throw new Error("Failed to append to draft");

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function resetDraft(
  supabase: SupabaseClient,
  moduleId: number
): Promise<TrainingNote | null> {
  const userId = await getUserId(supabase);

  const { data, error } = await supabase
    .from("training_notes")
    .update({
      draft: null,
      updated_at: new Date().toISOString(),
    })
    .eq("module_id", moduleId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No row found - create a new one with null draft
      const { data: newData, error: insertError } = await supabase
        .from("training_notes")
        .insert({
          module_id: moduleId,
          user_id: userId,
          draft: null,
        })
        .select("*")
        .single();

      if (insertError) handleError(insertError);
      if (!newData) throw new Error("Failed to reset draft");

      return {
        moduleId: newData.module_id,
        userId: newData.user_id,
        notes: newData.notes,
        draft: newData.draft,
        createdAt: new Date(newData.created_at),
        updatedAt: new Date(newData.updated_at),
      };
    }
    handleError(error);
  }

  if (!data) return null;

  return {
    moduleId: data.module_id,
    userId: data.user_id,
    notes: data.notes,
    draft: data.draft,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}
