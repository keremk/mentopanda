"use client";

import { Button } from "@/components/ui/button";
import { ImageGenerationDialog } from "@/components/image-generation-dialog";
import { Sparkles } from "lucide-react";
import type {
  ImageContextType,
  ImageAspectRatio,
} from "@/components/image-generation-dialog";

type ImageGenerationButtonProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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
  isOpen,
  onOpenChange,
  contextId,
  contextType,
  aspectRatio,
  onImageGenerated,
  buttonText = "Generate",
  buttonVariant = "ghost-brand",
  buttonSize = "default",
  showContextSwitch,
}: ImageGenerationButtonProps) {
  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => onOpenChange(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" /> {buttonText}
      </Button>
      <ImageGenerationDialog
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        contextId={contextId}
        contextType={contextType}
        aspectRatio={aspectRatio}
        onImageGenerated={onImageGenerated}
        showContextSwitch={showContextSwitch}
      />
    </>
  );
}
