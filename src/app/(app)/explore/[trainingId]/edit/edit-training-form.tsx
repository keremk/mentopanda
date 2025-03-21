"use client";

import { Input } from "@/components/ui/input";
import { useTrainingDetails } from "@/contexts/training-details-context";
import { ImageUploadButton } from "@/components/image-upload-button";
import Image from "next/image";
import { AIFocusInput } from "@/components/ai-focus-input";
import { AIFocusTextarea } from "@/components/ai-focus-textarea";

export function EditTrainingForm() {
  const { training, updateTrainingField } = useTrainingDetails();

  if (!training) {
    return <div>Loading training details...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="aspect-video w-full relative bg-secondary/30 rounded-xl overflow-hidden border border-border/30 shadow-sm">
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
                <span className="text-muted-foreground">No image uploaded</span>
              </div>
            )}
          </div>
          <ImageUploadButton
            onUploadComplete={async (url) => {
              updateTrainingField("imageUrl", url);
            }}
            bucket="trainings"
            folder="covers"
            buttonText="Upload Cover Image"
            buttonVariant="secondary"
            buttonSize="default"
          />
        </div>

        <div className="space-y-6 mt-5">
          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Title
            </label>
            <AIFocusInput
              fieldId="training-title"
              fieldType="title"
              name="title"
              value={training.title}
              onChange={(e) => updateTrainingField("title", e.target.value)}
              placeholder="Enter training title"
              className="text-base bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Tagline
            </label>
            <AIFocusInput
              fieldId="training-tagline"
              fieldType="tagline"
              name="tagline"
              value={training.tagline}
              onChange={(e) => updateTrainingField("tagline", e.target.value)}
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
              onChange={(e) =>
                updateTrainingField("previewUrl", e.target.value)
              }
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
          fieldId="training-description"
          fieldType="description"
          value={training.description || ""}
          onChange={(e) => updateTrainingField("description", e.target.value)}
          className="min-h-[calc(100vh-36rem)] bg-secondary/30 resize-none rounded-2xl border-border/30 shadow-sm text-base placeholder:text-muted-foreground/50"
          placeholder="Enter training description, use markdown for formatting"
        />
      </div>
    </>
  );
}

export default EditTrainingForm;
