"use client";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type ImageUploadButtonProps = {
  onUploadComplete: (url: string) => Promise<void>;
  bucket: string;
  folder: string;
  allowedFileTypes?: string[];
  dialogTitle?: string;
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
};

export function ImageUploadButton({
  onUploadComplete,
  bucket,
  folder,
  allowedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  dialogTitle = "Upload Image",
  buttonText = "Upload Image",
  buttonVariant = "ghost-brand",
  buttonSize = "sm",
}: ImageUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUploadComplete(url: string) {
    setIsUploading(true);
    try {
      await onUploadComplete(url);
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling upload:", error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-0">
          <ImageUpload
            bucket={bucket}
            folder={folder}
            onUploadComplete={handleUploadComplete}
            allowedFileTypes={allowedFileTypes}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
