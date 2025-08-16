"use client";

import { Input } from "@/components/ui/input";
import { ImageEdit } from "@/components/image-edit";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export function EditTrainingForm() {
  const { state, dispatch } = useTrainingEdit();
  const { training } = state;
  const { toast } = useToast();

  if (!training) {
    return <div>Loading training details...</div>;
  }

  const trainingId = training.id;
  const storageFolderPath = `trainings/${trainingId}`;
  const bucketName = "trainings";

  if (!trainingId) {
    logger.error("Training ID is missing!");
    return <div>Error: Training ID missing.</div>;
  }

  const handleFieldChange = (
    field: keyof typeof training,
    value: string | null
  ) => {
    if (
      field === "title" ||
      field === "tagline" ||
      field === "description" ||
      field === "imageUrl" ||
      field === "previewUrl"
    ) {
      dispatch({
        type: "UPDATE_TRAINING_FIELD",
        payload: { field, value },
      });
    }
  };

  function handleImageChange(
    newUrl: string,
    newPath: string,
    oldImageUrl: string | null
  ) {
    logger.debug("[TrainingForm] Image changed:", {
      newUrl,
      newPath,
      oldImageUrl,
    });
    dispatch({
      type: "UPDATE_TRAINING_FIELD",
      payload: { field: "imageUrl", value: newUrl },
    });
    toast({ title: "Image updated.", description: "Saving changes..." });
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="w-full max-w-lg mx-auto">
          <ImageEdit
            initialImageUrl={training.imageUrl}
            aspectRatio="landscape"
            bucketName={bucketName}
            storageFolderPath={storageFolderPath}
            contextId={trainingId.toString()}
            contextType="training"
            onImageChange={handleImageChange}
            className="w-full"
            imageContainerClassName="aspect-video"
            buttonSize="default"
            buttonSpacing="mt-3"
            title="Update Training Image"
          />
        </div>

        <div className="space-y-6 mt-5 px-4 pb-4">
          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <AIFocusInput
              name="title"
              value={training.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter training title"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-xs placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tagline
            </label>
            <AIFocusInput
              name="tagline"
              value={training.tagline || ""}
              onChange={(e) => handleFieldChange("tagline", e.target.value)}
              placeholder="Enter catchy, short tagline"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-xs placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Preview Video Url
            </label>
            <Input
              name="previewUrl"
              value={training.previewUrl || ""}
              onChange={(e) => handleFieldChange("previewUrl", e.target.value)}
              placeholder="Enter video link, e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-xs placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col grow">
        <label className="text-sm font-medium text-muted-foreground mb-2">
          Description
        </label>
        <AIFocusTextarea
          name="description"
          value={training.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className="min-h-[calc(100vh-36rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-xs text-base placeholder:text-muted-foreground/50"
          placeholder="Enter training description, use markdown for formatting"
        />
      </div>
    </>
  );
}

export default EditTrainingForm;
