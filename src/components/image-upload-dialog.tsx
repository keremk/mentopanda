"use client";

import { Button } from "@/components/ui/button"; // Keep Button for potential internal use if needed
import {
  Dialog, // Use Dialog components
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useRef } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { createClient } from "@/utils/supabase/client";
import { toast } from "@/hooks/use-toast";

type ImageUploadDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string, path: string) => Promise<void> | void;
  bucketName: string;
  storageFolderPath: string;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  dialogTitle?: string;
};

export function ImageUploadDialog({
  isOpen,
  onClose,
  onUploadComplete,
  bucketName,
  storageFolderPath,
  allowedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  maxFileSize = 10 * 1024 * 1024,
  dialogTitle = "Upload Image",
}: ImageUploadDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const hasHandledSuccess = useRef(false);

  const uploadHook = useSupabaseUpload({
    bucketName: bucketName,
    path: storageFolderPath,
    maxFiles: 1,
    allowedMimeTypes: allowedFileTypes,
    maxFileSize: maxFileSize,
    upsert: true,
  });

  // Reset hasHandledSuccess flag when isOpen becomes false (controlled by parent)
  // This ensures the success effect can run again if dialog is reopened quickly
  useEffect(() => {
    if (!isOpen) {
      hasHandledSuccess.current = false;
    }
  }, [isOpen]);

  // Success handling effect
  useEffect(() => {
    if (
      !uploadHook.loading &&
      uploadHook.isSuccess &&
      uploadHook.successes.length > 0
    ) {
      if (!hasHandledSuccess.current) {
        hasHandledSuccess.current = true;

        const handleComplete = async () => {
          try {
            const uploadedPathRaw = uploadHook.successes[0]?.uploadedPath;
            if (!uploadedPathRaw) {
              toast({
                variant: "destructive",
                title: "Upload Error",
                description: "Could not determine uploaded path.",
              });
              hasHandledSuccess.current = false; // Allow retry
              return;
            }
            // --- Path Normalization --- //
            let filePath = uploadedPathRaw;
            const expectedPrefix = `${bucketName}/`;
            if (filePath.startsWith(expectedPrefix)) {
              const pathAfterBucket = filePath.substring(expectedPrefix.length);
              if (pathAfterBucket.startsWith(`${bucketName}/`)) {
                filePath = pathAfterBucket;
              }
            }
            // --- End Normalization ---

            const { data } = supabase.storage
              .from(bucketName)
              .getPublicUrl(decodeURIComponent(filePath));

            if (data?.publicUrl) {
              await onUploadComplete(data.publicUrl, filePath);
              // Parent now controls closing via the isOpen prop
              // onClose(); // Don't call onClose directly here
            } else {
              toast({
                variant: "destructive",
                title: "Upload Error",
                description: "Failed to get public URL for uploaded image.",
              });
              hasHandledSuccess.current = false; // Allow retry
            }
          } catch (error) {
            console.error("Error calling onUploadComplete callback:", error);
            toast({
              variant: "destructive",
              title: "Processing Error",
              description: "Failed to process upload completion.",
            });
            hasHandledSuccess.current = false; // Allow retry
          }
        };
        handleComplete();
      }
    } else if (!uploadHook.loading) {
      if (!uploadHook.isSuccess || uploadHook.successes.length === 0) {
        hasHandledSuccess.current = false;
      }
    }
  }, [
    uploadHook.loading,
    uploadHook.isSuccess,
    uploadHook.successes,
    onUploadComplete,
    bucketName,
    supabase,
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-0">
          <Dropzone {...uploadHook}>
            <DropzoneContent />
            <DropzoneEmptyState />
          </Dropzone>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="ghost-brand" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
