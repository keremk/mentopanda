"use client";

import { Input } from "@/components/ui/input";
import { useTrainingDetails } from "@/contexts/training-details-context";
import { ImageUploadButton } from "@/components/image-upload-button";
import Image from "next/image";
import { MarkdownEditor } from "@/components/markdown-editor";

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

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              name="title"
              value={training.title}
              onChange={(e) => updateTrainingField("title", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tagline</label>
            <Input
              name="tagline"
              value={training.tagline}
              onChange={(e) => updateTrainingField("tagline", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Preview Video URL</label>
            <Input
              name="previewUrl"
              value={training.previewUrl || ""}
              onChange={(e) =>
                updateTrainingField("previewUrl", e.target.value)
              }
              placeholder="Enter video URL"
            />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <label className="text-sm font-medium">Description</label>
        <div className="border rounded-md">
          <MarkdownEditor
            content={training.description}
            onChange={(markdown) =>
              updateTrainingField("description", markdown)
            }
            className="min-h-[300px]"
          />
        </div>
      </div>
    </>
  );
}

export default EditTrainingForm;
