import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const names = name.trim().split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.toUpperCase();
}

/**
 * Extracts the storage path from a Supabase public URL.
 * Handles URLs with or without the '/public/' segment.
 * Example:
 * Input: https://<ref>.supabase.co/storage/v1/object/public/avatars/user-id/avatar.png
 * Output: avatars/user-id/avatar.png
 * Input: https://<ref>.supabase.co/storage/v1/object/avatars/user-id/avatar.png (if bucket isn't public maybe? Less common)
 * Output: avatars/user-id/avatar.png
 * Input: /local/placeholder.png
 * Output: null
 */
export function getPathFromStorageUrl(url: string): string | null {
  if (!url || !url.includes("/storage/v1/object/")) {
    return null; // Not a Supabase storage URL or invalid
  }
  try {
    const urlObject = new URL(url, "http://dummybase.com"); // Provide a dummy base if URL is relative
    const pathSegments = urlObject.pathname.split("/");

    // Find the index of 'object' and take everything after it, then after the bucket name
    const objectIndex = pathSegments.indexOf("object");
    if (objectIndex === -1 || objectIndex + 2 >= pathSegments.length) {
      return null; // Invalid structure
    }

    // Check if the segment after 'object' is 'public', if so, skip it and the bucket name
    const bucketNameIndex =
      pathSegments[objectIndex + 1] === "public"
        ? objectIndex + 2
        : objectIndex + 1;

    if (bucketNameIndex + 1 >= pathSegments.length) {
      return null; // No path after bucket name
    }

    // Join the remaining segments to form the path
    const storagePath = pathSegments.slice(bucketNameIndex + 1).join("/");

    // Decode URI component to handle spaces or special chars in filenames
    return decodeURIComponent(storagePath);
  } catch (error) {
    console.error("Error parsing storage URL:", error);
    return null;
  }
}

/**
 * Extracts the directory path (including trailing slash) from a storage path.
 * Example:
 * Input: avatars/user-id/avatar.png
 * Output: avatars/user-id/
 * Input: image.png
 * Output: null (or "" depending on desired behavior for root files)
 */
export function getDirectoryFromPath(path: string): string | null {
  if (!path) return null;
  const lastSlashIndex = path.lastIndexOf("/");

  // If no slash found, or it's the last character (shouldn't happen for valid paths)
  if (lastSlashIndex === -1 || lastSlashIndex === path.length - 1) {
    // Return null if it's just a filename or invalid
    // Consider returning "" if you want to represent the root directory?
    return null;
  }

  // Return the part of the string up to and including the last slash
  return path.substring(0, lastSlashIndex + 1);
}
