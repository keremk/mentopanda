"use client";

import { useState, useCallback, useEffect } from "react";
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

function base64ToBlob(base64: string, contentType = "image/png"): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

type ImageGenerationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  trainingId: string;
  onImageGenerated: (url: string) => void;
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

export function ImageGenerationDialog({
  isOpen,
  onClose,
  trainingId,
  onImageGenerated,
}: ImageGenerationDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>(
    imageStyles[0].value
  );
  const [includeContext, setIncludeContext] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = useCallback(async () => {
    if (
      !trainingId ||
      typeof trainingId !== "string" ||
      trainingId.length === 0
    ) {
      setError("Invalid or missing Training ID. Cannot generate image.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImageData(null);

    try {
      const actionInput = {
        trainingId,
        prompt: prompt.trim(),
        style: selectedStyle,
        includeContext,
      };
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
  }, [trainingId, prompt, selectedStyle, includeContext]);

  const handleUseImage = useCallback(async () => {
    if (!generatedImageData) {
      setError("No image data available to upload.");
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const imageBlob = base64ToBlob(generatedImageData);
      const fileName = `cover.png`;
      const storagePath = `trainings/${trainingId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("trainings")
        .upload(storagePath, imageBlob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "Client-side Supabase upload error object:",
          JSON.stringify(uploadError, null, 2)
        );
        const errorMessage = uploadError.message || "Unknown storage error";
        let userFriendlyError = `Storage upload failed: ${errorMessage}`; // Default

        if (errorMessage.includes("Bucket not found")) {
          userFriendlyError =
            "Storage bucket not found. Please contact support.";
        } else if (
          errorMessage.includes("Auth") ||
          errorMessage.includes("RLS") || // Catch the RLS error
          errorMessage.includes("security policy") // Catch the RLS error specifically
        ) {
          userFriendlyError =
            "Permission denied. Ensure you are logged in and have rights to upload.";
        } else {
          // Keep the default userFriendlyError
        }

        setError(userFriendlyError); // Keep inline error if desired
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: userFriendlyError,
        });
        setIsUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("trainings")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        const errorMsg =
          "Upload succeeded but failed to retrieve the image URL.";
        console.error(
          "Failed to get public URL after client upload for:",
          storagePath
        );
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Upload Issue",
          description: errorMsg,
        });
        setIsUploading(false);
        return;
      }

      onImageGenerated(urlData.publicUrl);
      toast({ title: "Image uploaded successfully!" });
      onClose();
    } catch (err) {
      console.error("Client-side upload process error:", err);
      const errorMsg =
        "An unexpected error occurred trying to upload the image.";
      setError(errorMsg);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMsg,
      });
    } finally {
      setIsUploading(false);
    }
  }, [generatedImageData, trainingId, onImageGenerated, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isGenerating && !isUploading) {
        handleGenerateClick();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedStyle(imageStyles[0].value);
        setIncludeContext(true);
        setPrompt("");
        setGeneratedImageData(null);
        setIsGenerating(false);
        setIsUploading(false);
        setError(null);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSelectedStyle(imageStyles[0].value);
      setIncludeContext(true);
      setPrompt("");
      setGeneratedImageData(null);
      setIsGenerating(false);
      setIsUploading(false);
      setError(null);
    }
  }, [isOpen]);

  const isLoading = isGenerating || isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] grid grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Generate Cover Image</DialogTitle>
        </DialogHeader>

        <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto px-6 pb-4">
          <div className="image-container-enhanced">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
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
                    disabled={isLoading || isGenerating}
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
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isUploading ? "Uploading..." : "Use This Image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImageGenerationDialog;
