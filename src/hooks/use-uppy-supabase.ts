import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Uppy } from "@uppy/core";
import Tus from "@uppy/tus";
import { nanoid } from "nanoid";

type UppySupabaseOptions = {
  bucketName: string;
  folderName: string;
  onUploadComplete: (url: string) => void;
  allowedFileTypes?: string[];
};

export const useUppyWithSupabase = ({
  bucketName,
  folderName,
  onUploadComplete,
  allowedFileTypes,
}: UppySupabaseOptions) => {

  const uppyRef = useRef<Uppy | null>(null);
  const supabase = createClient();
  const pluginIdRef = useRef(`image-uploader-${nanoid()}`);

  if (!uppyRef.current) {
    uppyRef.current = new Uppy({
      debug: process.env.NODE_ENV === "development",
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxNumberOfFiles: 1,
        allowedFileTypes: allowedFileTypes,
      },
    });
  }

  const uppy = uppyRef.current;

  useEffect(() => {
    const initializeUppy = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      uppy
        .use(Tus, {
          id: pluginIdRef.current,
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`, // Supabase TUS endpoint
          retryDelays: [0, 3000, 5000, 10000, 20000], // Retry delays for resumable uploads
          headers: {
            authorization: `Bearer ${session?.access_token}`, // User session access token
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // API key for Supabase
          },
          uploadDataDuringCreation: true, // Send metadata with file chunks
          removeFingerprintOnSuccess: true, // Remove fingerprint after successful upload
          chunkSize: 6 * 1024 * 1024, // Chunk size for TUS uploads (6MB)
          allowedMetaFields: [
            "bucketName",
            "objectName",
            "contentType",
            "cacheControl",
          ], // Metadata fields allowed for the upload
          onError: (error) => console.error("Upload error:", error), // Error handling for uploads
        })
        .on("file-added", (file) => {
          // Attach metadata to each file, including bucket name and content type
          const fileExt = file?.name?.split(".").pop();
          const fileName = `${folderName}/${crypto.randomUUID()}.${fileExt}`;

          file.meta = {
            ...file.meta,
            bucketName, // Bucket specified by the user of the hook
            objectName: fileName, // Use file name as object name
            contentType: file.type, // Set content type based on file MIME type
          };
        })
        .on("complete", async (result) => {
          if (!result.successful || result.successful.length === 0) {
            console.warn("No files were successfully uploaded");
            return;
          }

          const uploadedFile = result.successful[0];
          const fileName = uploadedFile.meta.objectName as string;

          if (!fileName) {
            console.error("Missing filename in uploaded file metadata");
            return;
          }

          const { publicUrl } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName).data;

          if (!publicUrl) {
            console.error("Failed to get public URL");
            return;
          }
          onUploadComplete(publicUrl);
        });
    };

    // Initialize Uppy with Supabase settings
    initializeUppy();

    // Cleanup function: remove the plugin on unmount so that
    // a subsequent Strict Mode mount doesn't see it as "already attached".
    return () => {
      const existing = uppy.getPlugin(pluginIdRef.current);
      if (existing) {
        uppy.removePlugin(existing);
      }
    };
  }, [uppy, bucketName, folderName, onUploadComplete, supabase.auth, supabase.storage]);

  // Return the configured Uppy instance
  return uppy;
};
