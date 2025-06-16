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
import { SendHorizontal, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { toast } from "@/hooks/use-toast";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import type { FileWithPreview } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { useApiKey } from "@/hooks/use-api-key";
import { logger } from "@/lib/logger";
import { NoCreditsDialog } from "@/components/no-credits-dialog";

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
}: ImageGenerationDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>(
    imageStyles[0].value
  );
  const [useCurrentImage, setUseCurrentImage] = useState(!!currentImageUrl);
  const [prompt, setPrompt] = useState("");
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);
  const [intermediateImageData, setIntermediateImageData] = useState<
    string | null
  >(null);
  const [streamStatus, setStreamStatus] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(2);
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(
    null
  );
  const supabase = useMemo(() => createClient(), []);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasHandledUploadSuccess = useRef(false);
  const { apiKey } = useApiKey();

  // Parse aspect ratio string for the component prop
  const numericAspectRatio = useMemo(() => {
    if (aspectRatio === "landscape") return 16 / 9;
    if (aspectRatio === "square") return 1;
    return 16 / 9; // Default fallback if needed
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

  const handleGenerateClick = useCallback(async () => {
    if (!contextId || typeof contextId !== "string" || contextId.length === 0) {
      setError(`Invalid or missing ${contextType} ID. Cannot generate image.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageData(null);
    setIntermediateImageData(null);
    setStreamStatus("");
    setCurrentStep(0);
    setTotalSteps(2);

    try {
      const requestBody: Record<string, unknown> = {
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio,
        apiKey,
      };

      // Add multi-turn editing support when editing a generated image
      if (useCurrentImage && currentResponseId) {
        requestBody.previousResponseId = currentResponseId;
      }
      // Add existing image URL for first-time editing of stored images
      else if (useCurrentImage && currentImageUrl && bucketName) {
        requestBody.existingImageUrl = currentImageUrl;
        requestBody.bucketName = bucketName;
      }

      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Log event type and metadata without base64 data
              const logData = { ...data };
              if (logData.imageData) {
                logData.imageData = `[base64 data: ${logData.imageData.length} chars]`;
              }
              logger.debug(
                `🔍 DEBUG: Received streaming event: ${data.type}`,
                logData
              );

              switch (data.type) {
                case "status":
                  logger.debug("📊 STATUS event:", {
                    type: data.type,
                    message: data.message,
                    step: data.step,
                    totalSteps: data.totalSteps,
                  });
                  setStreamStatus(data.message);
                  setCurrentStep(data.step);
                  setTotalSteps(data.totalSteps);
                  break;

                case "intermediate":
                  logger.debug("🖼️ INTERMEDIATE event:", {
                    type: data.type,
                    message: data.message,
                    step: data.step,
                    imageDataLength: data.imageData?.length,
                  });
                  setIntermediateImageData(data.imageData);
                  setStreamStatus(data.message);
                  setCurrentStep(data.step);
                  break;

                case "final":
                  logger.debug("✅ FINAL event received in dialog!");
                  logger.debug("✅ Image data length:", data.imageData?.length);
                  logger.debug("✅ About to call setGeneratedImageData");
                  setGeneratedImageData(data.imageData);
                  logger.debug(
                    "✅ Called setGeneratedImageData - button should be enabled now"
                  );
                  setStreamStatus(data.message);
                  setCurrentStep(data.step);
                  // Store response ID for potential multi-turn editing
                  if (data.responseId) {
                    setCurrentResponseId(data.responseId);
                    logger.debug(
                      "✅ Stored response ID for editing:",
                      data.responseId
                    );
                  }
                  // Auto-switch to "Use Current" mode after any generation
                  if (!useCurrentImage) {
                    setUseCurrentImage(true);
                    logger.debug("✅ Auto-switched to Use Current mode");
                  }
                  logger.info(
                    `Image generation completed in ${data.elapsedTime?.toFixed(2)}s`
                  );
                  break;

                case "error":
                  logger.debug("❌ ERROR event:", {
                    type: data.type,
                    error: data.error,
                  });
                  logger.error("Streaming image generation error:", data.error);

                  // Check if it's a credit error
                  if (
                    data.error &&
                    (data.error.includes("No credits available") ||
                      data.error.includes("402"))
                  ) {
                    logger.info(
                      "Credit error detected in streaming image generation, showing NoCreditsDialog"
                    );
                    setShowNoCreditsDialog(true);
                  }

                  setError(data.error);
                  break;

                default:
                  logger.debug(`❓ UNKNOWN event type: ${data.type}`, logData);
                  break;
              }
            } catch (parseError) {
              logger.error("Error parsing streaming data:", parseError);
            }
          }
        }
      }
    } catch (err) {
      logger.error("Streaming generation error:", err);
      setError("An unexpected error occurred trying to generate the image.");
    } finally {
      logger.debug("🏁 Stream completed, final state:", {
        generatedImageData: !!generatedImageData,
        generatedImageDataLength: generatedImageData?.length,
        error,
      });
      setIsGenerating(false);
      setStreamStatus("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contextId,
    contextType,
    prompt,
    selectedStyle,
    aspectRatio,
    useCurrentImage,
    currentImageUrl,
    bucketName,
    apiKey,
    currentResponseId,
  ]);

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

  // Reset hasHandledUploadSuccess flag when isOpen becomes false
  useEffect(() => {
    if (!isOpen) {
      hasHandledUploadSuccess.current = false;
    }
  }, [isOpen]);

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

            logger.debug(
              "Completion Effect: Getting public URL for path:",
              filePath
            );
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

  // Define isLoading state before return
  const isLoading = isGenerating || uploadHook.loading;

  // Determine if a prompt is absolutely required
  const isPromptRequired = !useCurrentImage;

  // Determine if the generate button should be disabled
  const isGenerateDisabled =
    isLoading ||
    (isPromptRequired && prompt.trim().length === 0) ||
    hasCreditError;

  // Debug button state
  logger.debug("🔍 BUTTON DEBUG:", {
    generatedImageData: !!generatedImageData,
    generatedImageDataLength: generatedImageData?.length,
    isLoading,
    hasCreditError,
    buttonDisabled: !generatedImageData || isLoading || hasCreditError,
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] grid grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Generate Cover Image</DialogTitle>
            <DialogDescription>
              Create AI-generated images with customizable styles and options
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto px-6 pb-4">
            <div className="image-container-enhanced">
              <AspectRatio
                ratio={numericAspectRatio}
                className="bg-muted rounded-lg relative overflow-hidden"
              >
                {/* Determine primary image source based on state and "Use Current" toggle */}
                {(() => {
                  let imageUrl: string | null = null;
                  let imageAlt = "";

                  // During generation, show intermediate images regardless of toggle
                  if (isGenerating && intermediateImageData) {
                    imageUrl = `data:image/png;base64,${intermediateImageData}`;
                    imageAlt = "Intermediate image preview";
                  }
                  // If "Use Current" is true, show the current image (generated or existing)
                  else if (useCurrentImage) {
                    if (generatedImageData) {
                      imageUrl = `data:image/png;base64,${generatedImageData}`;
                      imageAlt = "Generated image preview";
                    } else if (currentImageUrl) {
                      imageUrl = currentImageUrl;
                      imageAlt = "Current image";
                    }
                  }
                  // If "Use Current" is false, show blank (no image) to indicate new generation

                  return (
                    <>
                      {/* Render the image if available AND no error occurred AFTER generation */}
                      {imageUrl && !(error && !isGenerating) && (
                        <div className="image-inner w-full h-full">
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={cn(
                              "object-cover transition-opacity duration-300",
                              isGenerating &&
                                !generatedImageData &&
                                "opacity-70" // Dim intermediate images
                            )}
                            priority={
                              !isGenerating &&
                              useCurrentImage &&
                              !generatedImageData &&
                              !intermediateImageData &&
                              !!currentImageUrl &&
                              imageUrl === currentImageUrl
                            }
                          />
                          {/* Show step indicator overlay for intermediate images */}
                          {intermediateImageData && !generatedImageData && (
                            <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              Step {currentStep} of {totalSteps}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Render Placeholder only if no image source AND no error occurred AFTER generation */}
                      {!imageUrl && !(error && !isGenerating) && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <span>Image will appear here</span>
                        </div>
                      )}
                    </>
                  );
                })()}

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
                    <span className="text-white">
                      {streamStatus || "Generating..."}
                    </span>
                    {currentStep > 0 && totalSteps > 0 && (
                      <div className="text-white/80 text-sm mt-1">
                        Step {currentStep} of {totalSteps}
                      </div>
                    )}
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
                    onValueChange={(value) => setSelectedStyle(value as string)}
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
                <div className="flex flex-col items-center space-y-1 pt-1">
                  <Label
                    htmlFor="use-current-image"
                    className="text-xs font-medium"
                  >
                    Use Current
                  </Label>
                  <Switch
                    id="use-current-image"
                    checked={useCurrentImage}
                    onCheckedChange={setUseCurrentImage}
                    disabled={
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
                        : isPromptRequired
                          ? "Describe the image you want..."
                          : "Prompt is optional but recommended. Describe changes or a new image..."
                    }
                    className="flex-1 min-h-[60px] max-h-[100px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || hasCreditError}
                  />
                  <div className="flex items-center justify-end bg-secondary/40 px-3 py-1.5 border-t border-border/20">
                    <Button
                      type="button"
                      variant="ghost-brand"
                      size="sm"
                      onClick={handleGenerateClick}
                      disabled={isGenerateDisabled}
                      className="h-7 rounded-full px-3 flex items-center gap-1 text-xs"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <SendHorizontal className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {hasCreditError
                          ? "No Credits"
                          : isGenerating
                            ? useCurrentImage
                              ? "Editing..."
                              : "Generating..."
                            : useCurrentImage
                              ? "Edit"
                              : "Generate"}
                      </span>
                    </Button>
                  </div>
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
