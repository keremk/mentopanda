"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo, useRef } from "react";
import { UploadCloud } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { createClient } from "@/utils/supabase/client";

type ImageUploadButtonProps = {
  onUploadComplete: (url: string, path: string) => Promise<void>;
  bucket: string;
  folder: string;
  allowedFileTypes?: string[];
  maxFileSize?: number;
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
  maxFileSize = 10 * 1024 * 1024,
  dialogTitle = "Upload Image",
  buttonText = "Upload Image",
  buttonVariant = "ghost-brand",
  buttonSize = "sm",
}: ImageUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const hasHandledSuccess = useRef(false);

  const {
    getRootProps,
    getInputProps,
    open,
    isFocused,
    isDragActive,
    isDragAccept,
    isDragReject,
    isFileDialogActive,
    acceptedFiles,
    fileRejections,
    rootRef,
    files,
    setFiles,
    loading,
    errors,
    setErrors,
    successes,
    isSuccess,
    onUpload,
    maxFileSize: hookMaxFileSize,
    maxFiles: hookMaxFiles,
    allowedMimeTypes,
    inputRef,
  } = useSupabaseUpload({
    bucketName: bucket,
    path: folder,
    maxFiles: 1,
    allowedMimeTypes: allowedFileTypes,
    maxFileSize: maxFileSize,
    upsert: true,
  });

  useEffect(() => {
    if (!loading && isSuccess && successes.length > 0) {
      if (!hasHandledSuccess.current) {
        hasHandledSuccess.current = true;

        const handleComplete = async () => {
          try {
            const uploadedPath = successes[0]?.uploadedPath;
            if (!uploadedPath) {
              console.error(
                "Could not determine uploaded path after successful upload."
              );
              setErrors([
                {
                  name: "upload",
                  message: "Internal error: Path missing after upload.",
                },
              ]);
              return;
            }

            const filePath = uploadedPath;

            console.log(
              "Attempting getPublicUrl with bucket:",
              bucket,
              "and filePath:",
              filePath
            );
            const { data } = supabase.storage
              .from(bucket)
              .getPublicUrl(decodeURIComponent(filePath));

            if (data?.publicUrl) {
              await onUploadComplete(data.publicUrl, filePath);
              setIsOpen(false);
              setFiles([]);
              setErrors([]);
            } else {
              console.error(
                "Failed to get public URL (no data returned) for path:",
                filePath
              );
              setErrors([
                {
                  name: filePath,
                  message: "Failed to get public URL (no data)",
                },
              ]);
            }
          } catch (error) {
            console.error("Error calling onUploadComplete callback:", error);
            const errorPath = successes[0]?.uploadedPath ?? "upload";
            setErrors([
              {
                name: errorPath,
                message: "Error processing upload completion",
              },
            ]);
          }
        };
        handleComplete();
      }
    } else {
      hasHandledSuccess.current = false;
    }
  }, [
    loading,
    isSuccess,
    successes,
    onUploadComplete,
    bucket,
    folder,
    supabase,
    setFiles,
    setErrors,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setErrors([]);
    }
  }, [isOpen, setFiles, setErrors]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          disabled={loading}
        >
          {loading ? (
            "Uploading..."
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" /> {buttonText}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-0">
          <Dropzone
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            open={open}
            isFocused={isFocused}
            isDragActive={isDragActive}
            isDragAccept={isDragAccept}
            isDragReject={isDragReject}
            isFileDialogActive={isFileDialogActive}
            acceptedFiles={acceptedFiles}
            fileRejections={fileRejections}
            rootRef={rootRef}
            files={files}
            setFiles={setFiles}
            loading={loading}
            errors={errors}
            setErrors={setErrors}
            successes={successes}
            isSuccess={isSuccess}
            onUpload={onUpload}
            maxFileSize={hookMaxFileSize}
            maxFiles={hookMaxFiles}
            allowedMimeTypes={allowedMimeTypes}
            inputRef={inputRef}
          >
            <DropzoneContent />
            <DropzoneEmptyState />
          </Dropzone>
        </div>
      </DialogContent>
    </Dialog>
  );
}
