"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ImageUploadDialog } from "@/components/image-upload-dialog";
import { ImageGenerationDialog } from "@/components/image-generation-dialog";
import { UploadCloud, Sparkles, ImageIcon } from "lucide-react";
import { cn, getPathFromStorageUrl, getDirectoryFromPath } from "@/lib/utils";
import { deleteStorageObjectAction } from "@/app/actions/storage-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  ImageContextType,
  ImageAspectRatio,
} from "./image-generation-dialog";

// --- Helper Type for Button Variant --- //
type ButtonVariant = ButtonProps["variant"];

// --- Props Definition --- //
type ImageEditProps = {
  // Data & Context
  initialImageUrl: string | null;
  bucketName: string;
  storageFolderPath: string;
  contextId: string; // For generation
  contextType: ImageContextType; // For generation

  // Configuration
  aspectRatio: ImageAspectRatio;
  allowedFileTypes?: string[];
  maxFileSize?: number;

  // Callbacks
  onImageChange: (
    newUrl: string,
    newPath: string,
    oldImageUrl: string | null
  ) => void; // Parent ONLY handles DB update now

  // Styling & Layout
  className?: string; // For the main container div
  imageContainerClassName?: string; // For the AspectRatio/Avatar container
  imageClassName?: string; // For the next/image or AvatarImage component
  buttonContainerClassName?: string; // For the div holding buttons
  buttonSpacing?: string; // For controlling space between image and buttons
  buttonSize?: "sm" | "default" | "lg";
  buttonVariant?: ButtonVariant;
  imageShape?: "rectangular" | "circle";
  showButtonLabels?: boolean;
};

// --- Component Implementation --- //
export function ImageEdit({
  // Data & Context
  initialImageUrl,
  bucketName,
  storageFolderPath,
  contextId,
  contextType,
  // Configuration
  aspectRatio,
  allowedFileTypes,
  maxFileSize,
  // Callbacks
  onImageChange,
  // Styling & Layout
  className,
  imageContainerClassName,
  imageClassName,
  buttonContainerClassName,
  buttonSpacing = "mt-1",
  buttonSize = "sm",
  buttonVariant = "ghost-brand",
  imageShape = "rectangular",
  showButtonLabels = true,
}: ImageEditProps) {
  // --- State --- //
  const [currentImageUrl, setCurrentImageUrl] = useState(initialImageUrl);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isGenDialogOpen, setIsGenDialogOpen] = useState(false);
  const [uploadDialogKey, setUploadDialogKey] = useState(1);
  const [genDialogKey, setGenDialogKey] = useState(1);

  // Update internal state if initial prop changes
  useEffect(() => {
    setCurrentImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  // --- Derived Values --- //
  const numericAspectRatio = aspectRatio === "landscape" ? 16 / 9 : 1;

  // --- Deletion Logic --- (Moved into component)
  const handleDeleteOldImage = (
    oldImageUrl: string | null,
    newPath: string
  ) => {
    if (!oldImageUrl) {
      console.log("[ImageEdit] No previous image URL, skipping deletion.");
      return;
    }

    const oldImagePath = getPathFromStorageUrl(oldImageUrl);
    if (!oldImagePath) {
      console.warn(
        "[ImageEdit] Could not parse path from old URL, skipping deletion:",
        oldImageUrl
      );
      return;
    }

    const oldImageDir = getDirectoryFromPath(oldImagePath);
    const newImageDir = getDirectoryFromPath(newPath);

    if (
      oldImageDir &&
      newImageDir &&
      oldImageDir === newImageDir &&
      oldImagePath !== newPath
    ) {
      console.log(
        `[ImageEdit] Attempting deletion of old image: ${oldImagePath}`
      );
      // Call delete action but DO NOT await it
      deleteStorageObjectAction({ bucketName, path: oldImagePath }).then(
        (result) => {
          if (!result.success) {
            console.error(
              `[ImageEdit] Background deletion failed for ${oldImagePath}: ${result.error}`
            );
          } else {
            console.log(
              `[ImageEdit] Background deletion successful for ${oldImagePath}`
            );
          }
        }
      );
    } else {
      console.log(
        "[ImageEdit] Skipping deletion: directory mismatch, same path, or parse error.",
        { oldImageDir, newImageDir, oldImagePath, newPath }
      );
    }
  };

  // --- Callback Handlers --- //
  const handleUploadComplete = (newUrl: string, newPath: string) => {
    const oldUrl = currentImageUrl;
    setCurrentImageUrl(newUrl); // Optimistic UI update
    setIsUploadDialogOpen(false);
    handleDeleteOldImage(oldUrl, newPath); // Trigger deletion (don't await)
    onImageChange(newUrl, newPath, oldUrl); // Notify parent AFTER deletion initiated
  };

  const handleGenerationComplete = (newUrl: string, newPath: string) => {
    const oldUrl = currentImageUrl;
    setCurrentImageUrl(newUrl); // Optimistic UI update
    setIsGenDialogOpen(false);
    handleDeleteOldImage(oldUrl, newPath); // Trigger deletion (don't await)
    onImageChange(newUrl, newPath, oldUrl); // Notify parent AFTER deletion initiated
  };

  // --- Button Click Handlers (to also increment keys) --- //
  const handleOpenUploadDialog = () => {
    setUploadDialogKey((prevKey) => prevKey + 1); // Increment key
    setIsUploadDialogOpen(true);
  };

  const handleOpenGenDialog = () => {
    setGenDialogKey((prevKey) => prevKey + 1); // Increment key
    setIsGenDialogOpen(true);
  };

  // --- Render --- //
  return (
    <div className={cn("flex flex-col items-center w-auto gap-0", className)}>
      {/* Image Display - Conditional Rendering */}
      <div
        className={cn(
          "mx-auto mb-0 relative", // Use relative for potential absolute positioning of buttons later if needed
          imageShape === "rectangular"
            ? "w-full" // Allow AspectRatio to control width
            : "h-32 w-32", // Default size for Avatar, can be overridden by imageContainerClassName
          imageContainerClassName // Apply container class here
        )}
      >
        {imageShape === "rectangular" ? (
          <AspectRatio
            ratio={numericAspectRatio}
            className={cn(
              "bg-muted rounded-lg overflow-hidden border border-border/20 shadow-sm"
              // Removed rounded-full logic here, handled by Avatar
            )}
          >
            {currentImageUrl ? (
              <Image
                src={currentImageUrl}
                alt="Editable image"
                fill
                className={cn("object-cover", imageClassName)} // Removed m-0
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-10 w-10" />
                <span>No Image</span>
              </div>
            )}
          </AspectRatio>
        ) : (
          // Circular Shape using Avatar
          <Avatar className="h-full w-full border border-border/20 shadow-sm">
            <AvatarImage
              src={currentImageUrl ?? undefined} // Pass undefined if null
              alt="Editable image"
              className={cn("object-cover", imageClassName)} // Apply image class
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {/* Keep fallback consistent */}
              <ImageIcon className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Buttons - Adjusted positioning based on shape */}
      <div
        className={cn(
          "flex gap-2",
          buttonSpacing, // Use the prop directly
          buttonContainerClassName,
          // Apply default negative margin only for circle to overlap slightly if desired, or rely on buttonSpacing prop
          {
            "-mt-8": imageShape === "circle" && !buttonSpacing.startsWith("mt"),
          } // Example: small overlap for circle if no positive top margin is set
        )}
      >
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleOpenUploadDialog}
        >
          <UploadCloud className="h-4 w-4" />
          {showButtonLabels ? <span className="ml-2">Upload</span> : ""}
        </Button>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleOpenGenDialog}
        >
          <Sparkles className="h-4 w-4" />
          {showButtonLabels ? <span className="ml-2">Generate</span> : ""}
        </Button>
      </div>

      {/* Dialogs (Rendered conditionally) */}
      <ImageUploadDialog
        key={`upload-${uploadDialogKey}`}
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        bucketName={bucketName}
        storageFolderPath={storageFolderPath}
        allowedFileTypes={allowedFileTypes}
        maxFileSize={maxFileSize}
        onUploadComplete={handleUploadComplete}
      />

      <ImageGenerationDialog
        key={`gen-${genDialogKey}`}
        isOpen={isGenDialogOpen}
        onClose={() => setIsGenDialogOpen(false)}
        contextId={contextId}
        contextType={contextType}
        aspectRatio={aspectRatio}
        showContextSwitch={contextType === "training"} // Default logic for context switch
        onImageGenerated={handleGenerationComplete}
        currentImageUrl={currentImageUrl}
      />
    </div>
  );
}
