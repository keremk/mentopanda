import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getPathFromStorageUrl } from "@/lib/utils";

// Track storage files created during operations (for testing)
let testStorageTracker: { trackFile?: (bucket: string, path: string) => void } | null = null;

export function setTestStorageTracker(tracker: { trackFile: (bucket: string, path: string) => void } | null) {
  testStorageTracker = tracker;
}

/**
 * Copies a storage file from source URL to a new target path within the same bucket.
 * Downloads the file and re-uploads it to the new location.
 * 
 * @param supabase - Supabase client for storage operations
 * @param sourceUrl - Source file URL (can be null)
 * @param sourceBucket - Storage bucket name
 * @param targetPath - Target path within the bucket
 * @returns New public URL or original URL on error, null if sourceUrl was null
 */
export async function copyStorageFile(
  supabase: SupabaseClient,
  sourceUrl: string | null,
  sourceBucket: string,
  targetPath: string
): Promise<string | null> {
  if (!sourceUrl) return null;

  logger.debug(`[copyStorageFile] Starting copy: ${sourceUrl} -> ${sourceBucket}/${targetPath}`);

  try {
    // Extract the source path from the URL
    const sourcePath = getPathFromStorageUrl(sourceUrl);
    if (!sourcePath) {
      logger.error(`[copyStorageFile] Could not extract path from URL: ${sourceUrl}`);
      return sourceUrl; // Return original URL if we can't parse it
    }

    logger.debug(`[copyStorageFile] Extracted source path: ${sourcePath}`);

    // Download the file from source
    logger.debug(`[copyStorageFile] Downloading from ${sourceBucket}/${sourcePath}`);
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError) {
      logger.error(`[copyStorageFile] Failed to download file ${sourcePath}:`, downloadError);
      return sourceUrl; // Return original URL on error
    }

    logger.debug(`[copyStorageFile] Download successful, file size: ${fileData.size} bytes`);

    // Upload to new path
    logger.debug(`[copyStorageFile] Uploading to ${sourceBucket}/${targetPath}`);
    const { error: uploadError } = await supabase.storage
      .from(sourceBucket)
      .upload(targetPath, fileData, {
        upsert: true,
        contentType: fileData.type,
      });

    if (uploadError) {
      logger.error(`[copyStorageFile] Failed to upload file to ${targetPath}:`, uploadError);
      return sourceUrl; // Return original URL on error
    }

    // Track the new file for cleanup (if testing)
    if (testStorageTracker?.trackFile) {
      testStorageTracker.trackFile(sourceBucket, targetPath);
    }

    // Generate the new public URL
    const { data: publicUrlData } = supabase.storage
      .from(sourceBucket)
      .getPublicUrl(targetPath);

    logger.debug(`[copyStorageFile] Successfully copied storage file: ${sourcePath} -> ${targetPath}`);
    logger.debug(`[copyStorageFile] New URL: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error(`[copyStorageFile] Unexpected error copying storage file:`, error);
    return sourceUrl; // Return original URL on error
  }
}

/**
 * Copies a storage file using admin privileges to bypass RLS restrictions.
 * This is used for legitimate copy operations like copying public training assets.
 * 
 * @param sourceUrl - Source file URL (can be null)
 * @param sourceBucket - Storage bucket name
 * @param targetPath - Target path within the bucket
 * @returns New public URL or original URL on error, null if sourceUrl was null
 */
export async function copyStorageFileWithAdminPrivileges(
  sourceUrl: string | null,
  sourceBucket: string,
  targetPath: string
): Promise<string | null> {
  if (!sourceUrl) return null;

  logger.debug(`[copyStorageFileWithAdminPrivileges] Starting copy: ${sourceUrl} -> ${sourceBucket}/${targetPath}`);

  // Create admin client for storage operations
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("[copyStorageFileWithAdminPrivileges] Missing Supabase admin credentials");
    return sourceUrl; // Return original URL if we can't create admin client
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  try {
    // Extract the source path from the URL
    const sourcePath = getPathFromStorageUrl(sourceUrl);
    if (!sourcePath) {
      logger.error(`[copyStorageFileWithAdminPrivileges] Could not extract path from URL: ${sourceUrl}`);
      return sourceUrl; // Return original URL if we can't parse it
    }

    logger.debug(`[copyStorageFileWithAdminPrivileges] Extracted source path: ${sourcePath}`);

    // Download the file from source using admin client
    logger.debug(`[copyStorageFileWithAdminPrivileges] Downloading from ${sourceBucket}/${sourcePath}`);
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from(sourceBucket)
      .download(sourcePath);

    if (downloadError) {
      logger.error(`[copyStorageFileWithAdminPrivileges] Failed to download file ${sourcePath}:`, downloadError);
      return sourceUrl; // Return original URL on error
    }

    logger.debug(`[copyStorageFileWithAdminPrivileges] Download successful, file size: ${fileData.size} bytes`);

    // Upload to new path using admin client
    logger.debug(`[copyStorageFileWithAdminPrivileges] Uploading to ${sourceBucket}/${targetPath}`);
    const { error: uploadError } = await adminSupabase.storage
      .from(sourceBucket)
      .upload(targetPath, fileData, {
        upsert: true,
        contentType: fileData.type,
      });

    if (uploadError) {
      logger.error(`[copyStorageFileWithAdminPrivileges] Failed to upload file to ${targetPath}:`, uploadError);
      return sourceUrl; // Return original URL on error
    }

    // Track the new file for cleanup (if testing)
    if (testStorageTracker?.trackFile) {
      testStorageTracker.trackFile(sourceBucket, targetPath);
    }

    // Generate the new public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from(sourceBucket)
      .getPublicUrl(targetPath);

    logger.debug(`[copyStorageFileWithAdminPrivileges] Successfully copied storage file: ${sourcePath} -> ${targetPath}`);
    logger.debug(`[copyStorageFileWithAdminPrivileges] New URL: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error(`[copyStorageFileWithAdminPrivileges] Unexpected error copying storage file:`, error);
    return sourceUrl; // Return original URL on error
  }
}