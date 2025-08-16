"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { toast } from "@/hooks/use-toast";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import type { FileWithPreview } from "@/hooks/use-supabase-upload";
import { logger } from "@/lib/logger";
import { NoCreditsDialog } from "@/components/no-credits-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

function base64ToBlob(base64: string, contentType = "image/png"): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export type ImageContextType = "training" | "character" | "user";
export type ImageAspectRatio = "landscape" | "square";

type ImageGenerationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
  contextType: ImageContextType;
  onImageGenerated: (url: string, path: string) => void;
  aspectRatio: ImageAspectRatio;
  currentImageUrl?: string | null;
  title?: string;
};

const imageStyles: { value: string; label: string }[] = [
  { value: "anime, ghibli", label: "Anime" },
  { value: "pixar 3D", label: "Pixar 3D" },
  { value: "cartoon, comic book, cel shading", label: "Cartoon" },
  { value: "low poly, isometric art", label: "Low Poly" },
  { value: "watercolor, impressionist, monet", label: "Watercolor" },
  { value: "steampunk, victorian, science fiction", label: "Steampunk" },
  { value: "sketch, pencil drawing", label: "Sketch" },
  { value: "photorealistic, hyperrealistic", label: "Photorealistic" },
  { value: "cinematic, dramatic lighting", label: "Cinematic" },
  { value: "custom", label: "Custom" },
];

export function ImageGenerationDialog({
  isOpen,
  onClose,
  contextId,
  contextType,
  onImageGenerated,
  aspectRatio,
  currentImageUrl,
  title = "Generate Cover Image",
}: ImageGenerationDialogProps) {
  // TEMPORARY: Set to true to re-enable "Use Current" functionality
  const ENABLE_USE_CURRENT = false;

  const [selectedStyle, setSelectedStyle] = useState<string>(
    imageStyles[0].value
  );
  const [useCurrentImage, setUseCurrentImage] = useState(
    ENABLE_USE_CURRENT ? !!currentImageUrl : false
  );
  const [prompt, setPrompt] = useState("");
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasHandledUploadSuccess = useRef(false);
  const isMobile = useIsMobile();

  // Parse aspect ratio string for the component prop
  const numericAspectRatio = useMemo(() => {
    if (aspectRatio === "landscape") return 4 / 3;  // Updated to match Replicate 4:3
    if (aspectRatio === "square") return 1;
    return 4 / 3; // Default fallback if needed
  }, [aspectRatio]);

  const imageContainerClasses = useMemo(() => {
    const baseClasses = "w-full mx-auto";
    if (aspectRatio === "landscape") {
      // Wider for landscape images to give them more presence
      return `${baseClasses} max-w-[20rem] sm:max-w-88 md:max-w-[24rem] lg:max-w-lg xl:max-w-160`;
    }
    // Use user's preferred, more constrained sizes for square images
    return `${baseClasses} max-w-52 sm:max-w-56 md:max-w-[16rem] lg:max-w-76`;
  }, [aspectRatio]);

  // Determine bucket and path based on contextType
  const bucketName = useMemo(() => {
    if (contextType === "training") return "trainings";
    if (contextType === "character") return "avatars";
    if (contextType === "user") return "avatars";
    return "default-bucket";
  }, [contextType]);

  const uploadPath = useMemo(() => {
    if (contextType === "training") return `trainings/${contextId}`;
    if (contextType === "character") return `character-avatars/${contextId}`;
    if (contextType === "user") return `user-avatars/${contextId}`;
    return `unknown-context/${contextId}`;
  }, [contextType, contextId]);

  const uploadHook = useSupabaseUpload({
    bucketName: bucketName,
    path: uploadPath,
    maxFiles: 1,
    upsert: true,
  });

  // Check if there's a credit-related error
  const hasCreditError = Boolean(
    error &&
      (error.includes("No credits available") ||
        error.includes("402") ||
        showNoCreditsDialog)
  );

  const handleUseImage = useCallback(async () => {
    if (!generatedImageData) {
      setError("No image data available to upload.");
      return;
    }
    hasHandledUploadSuccess.current = false;
    uploadHook.setFiles([]);
    uploadHook.setErrors([]);

    try {
      const imageBlob = base64ToBlob(generatedImageData);
      const imageFile = new File([imageBlob], "generated_cover.png", {
        type: "image/png",
      });
      const fileForHook: FileWithPreview = Object.assign(imageFile, {
        preview: undefined,
        errors: [],
      });
      uploadHook.setFiles([fileForHook]);
      await uploadHook.onUpload();
    } catch (err) {
      logger.error("Error initiating upload process:", err);
      const errorMsg =
        "An unexpected error occurred trying to start the image upload.";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMsg,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    generatedImageData,
    uploadHook.setFiles,
    uploadHook.onUpload,
    uploadHook.setErrors,
  ]);

  // Reset hasHandledUploadSuccess flag when isOpen becomes false and cleanup object URL
  useEffect(() => {
    if (!isOpen) {
      hasHandledUploadSuccess.current = false;
      // Clean up object URL when dialog closes
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
        setImageObjectUrl(null);
      }
    }
  }, [isOpen, imageObjectUrl]);

  // Simple function for generating images using Replicate API
  const generateImageWithReplicate = useCallback(async () => {
    const requestBody = {
      prompt: prompt.trim(),
      style: selectedStyle,
      aspectRatio,
    };

    const response = await fetch("/api/replicate/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Check for credit-related errors
      if (
        response.status === 402 ||
        errorData.error?.includes("No credits available") ||
        errorData.error?.includes("402")
      ) {
        logger.info(
          "Credit error detected in Replicate image generation, showing NoCreditsDialog"
        );
        setShowNoCreditsDialog(true);
        setError("No credits available");
        return;
      }

      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const responseData = await response.json();

    if (responseData.success && responseData.imageData) {
      logger.debug("✅ Replicate generation completed!");
      logger.debug("✅ Image data length:", responseData.imageData?.length);

      setGeneratedImageData(responseData.imageData);
      
      // Create object URL for better performance and to avoid source map warnings
      const imageBlob = base64ToBlob(responseData.imageData);
      const objectUrl = URL.createObjectURL(imageBlob);
      setImageObjectUrl(objectUrl);

      logger.info(
        `Replicate image generation completed in ${responseData.elapsedTime?.toFixed(
          2
        )} seconds`
      );
      // Keep prompt for easy modification/regeneration
    } else {
      throw new Error("Invalid response from image generation service");
    }
  }, [prompt, selectedStyle, aspectRatio]);

  const handleGenerateClick = useCallback(async () => {
    if (!contextId || typeof contextId !== "string" || contextId.length === 0) {
      setError(`Invalid or missing ${contextType} ID. Cannot generate image.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageData(null);
    
    // Clean up previous object URL
    if (imageObjectUrl) {
      URL.revokeObjectURL(imageObjectUrl);
      setImageObjectUrl(null);
    }

    try {
      // Always use Replicate API for new image generation
      await generateImageWithReplicate();
    } catch (err) {
      logger.error("Image generation error:", err);
      setError("An unexpected error occurred trying to generate the image.");
    } finally {
      setIsGenerating(false);
    }
  }, [contextId, contextType, generateImageWithReplicate, imageObjectUrl]);

  // Success handling effect for the internal upload hook
  useEffect(() => {
    if (
      !uploadHook.loading &&
      uploadHook.isSuccess &&
      uploadHook.successes.length > 0
    ) {
      if (!hasHandledUploadSuccess.current) {
        hasHandledUploadSuccess.current = true;

        const handleComplete = async () => {
          try {
            const uploadedPathRaw = uploadHook.successes[0]?.uploadedPath;
            if (!uploadedPathRaw) {
              logger.error(
                "Completion Effect: Could not determine uploaded path."
              );
              setError("Upload succeeded but failed to get path.");
              return;
            }

            let filePath = uploadedPathRaw;
            const expectedPrefix = `${bucketName}/`;
            if (filePath.startsWith(expectedPrefix)) {
              const pathAfterBucket = filePath.substring(expectedPrefix.length);
              if (pathAfterBucket.startsWith(`${bucketName}/`)) {
                logger.warn(
                  `Detected duplicated bucket name in generated uploadedPath: ${filePath}. Normalizing.`
                );
                filePath = pathAfterBucket;
              }
            }

            const { data } = supabase.storage
              .from(bucketName)
              .getPublicUrl(decodeURIComponent(filePath));

            if (data?.publicUrl) {
              onImageGenerated(data.publicUrl, filePath);
              toast({ title: "Image uploaded successfully!" });
            } else {
              const errorMsg =
                "Upload succeeded but failed to retrieve the image URL.";
              logger.error(`Completion Effect: ${errorMsg} Path: ${filePath}`);
              setError(errorMsg);
              toast({
                variant: "destructive",
                title: "Upload Issue",
                description: errorMsg,
              });
            }
          } catch (error) {
            const errorMsg = "Error processing upload completion.";
            logger.error("Completion Effect Error:", error);
            setError(errorMsg);
            toast({
              variant: "destructive",
              title: "Error",
              description: errorMsg,
            });
          }
        };
        handleComplete();
      }
    } else if (!uploadHook.loading) {
      if (!uploadHook.isSuccess || uploadHook.successes.length === 0) {
        hasHandledUploadSuccess.current = false;
      }
    }
  }, [
    uploadHook.loading,
    uploadHook.isSuccess,
    uploadHook.successes,
    onImageGenerated,
    supabase,
    bucketName,
  ]);

  // Error handling effect for upload hook
  useEffect(() => {
    if (uploadHook.errors.length > 0) {
      const hookError = uploadHook.errors[0];
      const message = `Upload failed: ${hookError.message}`;
      setError(message);
    }
  }, [uploadHook.errors]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isGenerating && !uploadHook.loading) {
        handleGenerateClick();
      }
    }
  };

  const handleBlur = () => {
    if (isMobile) {
      window.scrollTo(0, 0);
    }
  };

  // Define isLoading state before return
  const isLoading = isGenerating || uploadHook.loading;

  // Determine if a prompt is required (always required for new generation)
  const isPromptRequired = prompt.trim().length === 0;

  // Determine if the generate button should be disabled
  const isGenerateDisabled = isLoading || isPromptRequired || hasCreditError;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              AI-generated images with custom styles
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto px-6 pb-4">
            <div className={imageContainerClasses}>
              <AspectRatio
                ratio={numericAspectRatio}
                className="bg-muted rounded-lg relative overflow-hidden"
              >
                {/* Show generated image if available and no error */}
                {imageObjectUrl && !(error && !isGenerating) && (
                  <div className="image-inner w-full h-full relative">
                    <Image
                      src={imageObjectUrl}
                      alt="Generated image preview"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-opacity duration-300"
                    />
                  </div>
                )}

                {/* Show placeholder when no image and no error */}
                {!imageObjectUrl && !(error && !isGenerating) && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span>Image will appear here</span>
                  </div>
                )}

                {/* Render Error State (if error occurred AFTER generation) */}
                {error && !isGenerating && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 text-destructive px-4 text-center">
                    {" "}
                    {/* Increased opacity */}
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <span>
                      {hasCreditError ? "No credits available" : error}
                    </span>
                  </div>
                )}

                {/* Render Loading Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md">
                    <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                    <span className="text-white">Generating...</span>
                  </div>
                )}
              </AspectRatio>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="image-style" className="text-xs font-medium">
                    Style
                  </Label>
                  <Select
                    value={selectedStyle}
                    onValueChange={(value: string) => setSelectedStyle(value)}
                    disabled={isLoading || hasCreditError}
                  >
                    <SelectTrigger
                      id="image-style"
                      className="h-9 focus:ring-brand"
                    >
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* TEMPORARY: Hidden when ENABLE_USE_CURRENT is false */}
                <div
                  className="flex flex-col items-center space-y-1 pt-1"
                  style={{ display: ENABLE_USE_CURRENT ? "flex" : "none" }}
                >
                  <Label
                    htmlFor="use-current-image"
                    className="text-xs font-medium"
                  >
                    Use Current
                  </Label>
                  <Switch
                    id="use-current-image"
                    checked={useCurrentImage}
                    onCheckedChange={
                      ENABLE_USE_CURRENT ? setUseCurrentImage : undefined
                    }
                    disabled={
                      !ENABLE_USE_CURRENT ||
                      isLoading ||
                      (!currentImageUrl && !generatedImageData) ||
                      hasCreditError
                    }
                    className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-input focus-visible:ring-brand"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="prompt" className="text-xs font-medium">
                  Prompt / Refinement Instructions
                </Label>
                <div className="mt-1 rounded-lg bg-secondary/30 border border-border/30 overflow-hidden flex flex-col group focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      hasCreditError
                        ? "No credits available - purchase credits to continue..."
                        : "Describe the image you want..."
                    }
                    className="flex-1 min-h-[80px] max-h-[120px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    disabled={isLoading || hasCreditError}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button
              variant="ghost-brand"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost-brand"
              onClick={handleGenerateClick}
              disabled={isGenerateDisabled}
            >
              {hasCreditError ? "No Credits" : "Generate"}
            </Button>
            <Button
              variant="brand"
              onClick={handleUseImage}
              disabled={!generatedImageData || isLoading || hasCreditError}
            >
              {uploadHook.loading && !isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {uploadHook.loading && !isGenerating
                ? "Uploading..."
                : "Use This Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NoCreditsDialog
        isOpen={showNoCreditsDialog}
        onOpenChange={setShowNoCreditsDialog}
        title="No Credits Available"
        description="You don't have enough credits to generate images. Purchase additional credits to continue using AI features."
      />
    </>
  );
}

export default ImageGenerationDialog;
