"use client";

import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { useUppyWithSupabase } from "@/hooks/use-uppy-supabase";
type ImageUploadProps = {
  bucket: string;
  folder: string;
  onUploadComplete: (url: string) => void;
  allowedFileTypes?: string[];
};

export function ImageUpload({
  bucket,
  folder,
  onUploadComplete,
  allowedFileTypes = ["image/*"],
}: ImageUploadProps) {
  const uppy = useUppyWithSupabase({
    bucketName: bucket,
    folderName: folder,
    onUploadComplete,
  });

  return (
    <div id="drag-drop-area">
      <Dashboard uppy={uppy} showProgressDetails={true} />
    </div>
  );
}
