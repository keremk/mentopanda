"use client";

import { Input } from "@/components/ui/input";
import { ImageUploadButton } from "@/components/image-upload-button";
import Image from "next/image";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { ImageGenerationButton } from "@/components/image-generation-button"; // Import the new component

export function EditTrainingForm() {
  const { state, dispatch } = useTrainingEdit();
  const { training } = state;
  // Removed dialog state as it's now managed by ImageGenerationButton
  // const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] =
  //   useState(false);

  if (!training) {
    return <div>Loading training details...</div>;
  }

  const trainingId = training.id;

  if (!trainingId) {
    console.error("Training ID is missing!");
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

  const handleGeneratedImage = (url: string, path: string) => {
    dispatch({
      type: "UPDATE_TRAINING_FIELD",
      payload: { field: "imageUrl", value: url },
    });
    console.log(
      "[EditTrainingForm] Generated image path (needs handling):",
      path
    );
    // Dialog closing is handled within ImageGenerationButton/Dialog now
    // setIsImageGenerationDialogOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="aspect-video w-full relative bg-secondary/30 rounded-xl overflow-hidden border border-border/30 shadow-sm image-container-enhanced">
            <div className="image-inner">
              {training.imageUrl ? (
                <Image
                  src={training.imageUrl}
                  alt={training.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">
                    No image uploaded
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <ImageUploadButton
              onUploadComplete={async (url, path) => {
                dispatch({
                  type: "UPDATE_TRAINING_FIELD",
                  payload: { field: "imageUrl", value: url },
                });
                console.log(
                  "[EditTrainingForm] Uploaded image path (needs handling):",
                  path
                );
              }}
              bucket="trainings"
              folder={`trainings/${trainingId}`}
              buttonText="Upload"
              buttonVariant="ghost-brand"
              buttonSize="default"
            />
            <ImageGenerationButton
              contextId={trainingId.toString()}
              contextType="training"
              aspectRatio="landscape"
              onImageGenerated={handleGeneratedImage}
              // Optional: customize props if needed
              // buttonText="Generate New"
              // buttonVariant="secondary"
              // buttonSize="lg"
            />
          </div>
        </div>

        <div className="space-y-6 mt-5">
          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <AIFocusInput
              name="title"
              value={training.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Enter training title"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
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
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
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
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col flex-grow">
        <label className="text-sm font-medium text-muted-foreground mb-2">
          Description
        </label>
        <AIFocusTextarea
          name="description"
          value={training.description || ""}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className="min-h-[calc(100vh-36rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
          placeholder="Enter training description, use markdown for formatting"
        />
      </div>
    </>
  );
}

export default EditTrainingForm;
