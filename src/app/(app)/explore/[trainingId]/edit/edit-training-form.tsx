"use client";

import { useState } from "react";
// import { useParams } from "next/navigation"; // Removed unused import
import { Input } from "@/components/ui/input";
import { ImageUploadButton } from "@/components/image-upload-button";
import Image from "next/image";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";
import { useTrainingEdit } from "@/contexts/training-edit-context";
import { Button } from "@/components/ui/button";
import { ImageGenerationDialog } from "@/components/image-generation-dialog";
import { Sparkles } from "lucide-react";

export function EditTrainingForm() {
  const { state, dispatch } = useTrainingEdit();
  const { training } = state;
  const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] =
    useState(false);

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

  const handleGeneratedImage = (url: string) => {
    handleFieldChange("imageUrl", url);
    setIsImageGenerationDialogOpen(false);
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
            <div>
              <ImageUploadButton
                onUploadComplete={async (url) => {
                  handleFieldChange("imageUrl", url);
                }}
                bucket="trainings"
                folder="covers"
                buttonText="Upload"
                buttonVariant="ghost-brand"
                buttonSize="default"
              />
            </div>
            <Button
              variant="ghost-brand"
              size="default"
              onClick={() => setIsImageGenerationDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Generate
            </Button>
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

      <ImageGenerationDialog
        isOpen={isImageGenerationDialogOpen}
        onClose={() => setIsImageGenerationDialogOpen(false)}
        trainingId={trainingId.toString()}
        onImageGenerated={handleGeneratedImage}
      />
    </>
  );
}

export default EditTrainingForm;
