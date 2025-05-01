"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
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
import { generateImageAction } from "@/app/actions/generate-images";
import { toast } from "@/hooks/use-toast";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import type { FileWithPreview } from "@/hooks/use-supabase-upload";

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
  showContextSwitch?: boolean;
};

const imageStyles: { value: string; label: string }[] = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "cinematic", label: "Cinematic" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "sketch", label: "Sketch" },
  { value: "pixar 3D", label: "Pixar 3D" },
  { value: "custom", label: "Custom" },
];

// Define a type for the action input based on usage
type GenerateImageActionInput = {
  contextId: string;
  contextType: ImageContextType;
  prompt: string;
  style: string;
  aspectRatio: ImageAspectRatio;
  includeContext?: boolean;
};

export function ImageGenerationDialog({
  isOpen,
  onClose,
  contextId,
  contextType,
  onImageGenerated,
  aspectRatio,
  showContextSwitch = true,
}: ImageGenerationDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>(
    imageStyles[0].value
  );
  const [includeContext, setIncludeContext] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasHandledUploadSuccess = useRef(false);

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

  const handleGenerateClick = useCallback(async () => {
    if (!contextId || typeof contextId !== "string" || contextId.length === 0) {
      setError(`Invalid or missing ${contextType} ID. Cannot generate image.`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageData(null);

    try {
      const actionInput: GenerateImageActionInput = {
        contextId,
        contextType,
        prompt: prompt.trim(),
        style: selectedStyle,
        aspectRatio,
      };
      if (showContextSwitch) {
        actionInput.includeContext = includeContext;
      }
      console.log("Sending to server action:", actionInput);

      const result = await generateImageAction(actionInput);

      if (result.success) {
        setGeneratedImageData(result.imageData);
        console.log("Image data received successfully!");
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Generation action invocation error:", err);
      setError("An unexpected error occurred trying to generate the image.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    contextId,
    contextType,
    prompt,
    selectedStyle,
    includeContext,
    showContextSwitch,
    aspectRatio,
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
      console.error("Error initiating upload process:", err);
      const errorMsg =
        "An unexpected error occurred trying to start the image upload.";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMsg,
      });
    }
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
              console.error(
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
                console.warn(
                  `Detected duplicated bucket name in generated uploadedPath: ${filePath}. Normalizing.`
                );
                filePath = pathAfterBucket;
              }
            }

            console.log(
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
              console.error("Completion Effect:", errorMsg, "Path:", filePath);
              setError(errorMsg);
              toast({
                variant: "destructive",
                title: "Upload Issue",
                description: errorMsg,
              });
            }
          } catch (error) {
            const errorMsg = "Error processing upload completion.";
            console.error("Completion Effect Error:", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] grid grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Generate Cover Image</DialogTitle>
        </DialogHeader>

        <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto px-6 pb-4">
          <div className="image-container-enhanced">
            <AspectRatio
              ratio={numericAspectRatio}
              className="bg-muted rounded-lg"
            >
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span>Generating...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-destructive px-4 text-center">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span>{error}</span>
                </div>
              ) : generatedImageData ? (
                <div className="image-inner">
                  <Image
                    src={`data:image/png;base64,${generatedImageData}`}
                    alt="Generated cover image preview"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span>Image will appear here</span>
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
                  disabled={isLoading}
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
              {showContextSwitch && (
                <div className="flex flex-col items-center space-y-1 pt-1">
                  <Label
                    htmlFor="include-context"
                    className="text-xs font-medium"
                  >
                    Use Context
                  </Label>
                  <Switch
                    id="include-context"
                    checked={includeContext}
                    onCheckedChange={setIncludeContext}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-brand data-[state=unchecked]:bg-input focus-visible:ring-brand"
                  />
                </div>
              )}
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
                  placeholder="Describe the image you want or how to change the current one..."
                  className="flex-1 min-h-[60px] max-h-[100px] resize-none border-0 bg-transparent p-3 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <div className="flex items-center justify-end bg-secondary/40 px-3 py-1.5 border-t border-border/20">
                  <Button
                    type="button"
                    variant="ghost-brand"
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={isLoading}
                    className="h-7 rounded-full px-3 flex items-center gap-1 text-xs"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-3.5 w-3.5" />
                    )}
                    <span>{isGenerating ? "Generating..." : "Generate"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="ghost-brand" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={handleUseImage}
            disabled={!generatedImageData || isLoading}
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
  );
}

export default ImageGenerationDialog;
