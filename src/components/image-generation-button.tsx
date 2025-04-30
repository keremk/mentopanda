"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageGenerationDialog } from "@/components/image-generation-dialog";
import { Sparkles } from "lucide-react";
import type {
  ImageContextType,
  ImageAspectRatio,
} from "@/components/image-generation-dialog";

type ImageGenerationButtonProps = {
  contextId: string;
  contextType: ImageContextType;
  aspectRatio: ImageAspectRatio;
  onImageGenerated: (url: string, path: string) => void;
  buttonText?: string;
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "ghost-brand"
    | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  showContextSwitch?: boolean;
};

export function ImageGenerationButton({
  contextId,
  contextType,
  aspectRatio,
  onImageGenerated,
  buttonText = "Generate",
  buttonVariant = "ghost-brand",
  buttonSize = "default",
  showContextSwitch,
}: ImageGenerationButtonProps) {
  const [isImageGenerationDialogOpen, setIsImageGenerationDialogOpen] =
    useState(false);

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setIsImageGenerationDialogOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" /> {buttonText}
      </Button>
      <ImageGenerationDialog
        isOpen={isImageGenerationDialogOpen}
        onClose={() => setIsImageGenerationDialogOpen(false)}
        contextId={contextId}
        contextType={contextType}
        aspectRatio={aspectRatio}
        onImageGenerated={onImageGenerated}
        showContextSwitch={showContextSwitch}
      />
    </>
  );
}
