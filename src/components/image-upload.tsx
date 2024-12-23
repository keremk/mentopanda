"use client";

import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { useUppyWithSupabase } from "@/hooks/use-uppy-supabase";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  bucket: string;
  folder: string;
  onUploadComplete: (url: string) => void;
  allowedFileTypes?: string[];
  className?: string;
};

export function ImageUpload({
  bucket,
  folder,
  onUploadComplete,
  allowedFileTypes = ["image/*"],
  className,
}: ImageUploadProps) {
  const uppy = useUppyWithSupabase({
    bucketName: bucket,
    folderName: folder,
    onUploadComplete,
  });

  return (
    <div className={cn("relative w-full rounded-lg bg-background", className)}>
      <style jsx global>{`
        .uppy-Dashboard-inner {
          border: none !important;
          border-radius: 0 !important;
          background: transparent !important;
          width: 100% !important;
          height: 300px !important;
        }
        .uppy-Dashboard-AddFiles {
          border: 2px dashed hsl(var(--border));
          background: transparent;
        }
        .uppy-StatusBar {
          background: transparent !important;
          border: none !important;
        }
        .uppy-StatusBar-actions {
          background: transparent !important;
          padding: 0 !important;
        }
        .uppy-StatusBar-actionBtn--upload {
          background: #2fb344 !important;
          border: none !important;
          color: white !important;
        }
        .uppy-StatusBar-actionBtn--upload:hover {
          background: #2aa23e !important;
        }
        .uppy-Dashboard-browse {
          color: hsl(var(--primary));
        }
        .uppy-Dashboard-dropFilesHereHint {
          color: hsl(var(--muted-foreground));
        }
        .uppy-Dashboard-Item {
          background: hsl(var(--background));
        }
        .uppy-Dashboard-Item-name {
          color: hsl(var(--foreground));
        }
        .uppy-Dashboard-Item-statusSize {
          color: hsl(var(--muted-foreground));
        }
        .uppy-Dashboard-browse:hover {
          color: hsl(var(--primary));
          opacity: 0.8;
        }
      `}</style>
      <Dashboard
        uppy={uppy}
        showProgressDetails={true}
        proudlyDisplayPoweredByUppy={false}
        theme="dark"
        width="100%"
        height="300px"
        className="!bg-background"
      />
    </div>
  );
}
